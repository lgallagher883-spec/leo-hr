import type { SupabaseClient } from "@supabase/supabase-js";
import { docuSignBinaryRequest, docuSignRequest, getDocuSignContext } from "./client";
import type { CreateSignatureEnvelopeInput, DocuSignEnvelopeResponse, DocuSignEnvelopeStatusResponse, SignatureEnvelopeStatus } from "./types";

function status(value?: string | null): SignatureEnvelopeStatus {
  const v=(value||"").toLowerCase();
  return ["created","sent","delivered","completed","declined","voided","expired"].includes(v) ? v as SignatureEnvelopeStatus : "error";
}

export async function createSignatureEnvelope(admin: SupabaseClient, input: CreateSignatureEnvelopeInput) {
  const context=await getDocuSignContext(admin,input.organisationId,input.connectionId);
  const provider=await docuSignRequest<DocuSignEnvelopeResponse>(context,"/envelopes","POST",{
    emailSubject: input.emailSubject,
    emailBlurb: input.emailMessage || undefined,
    documents:[{ documentBase64: input.documentBase64, name: input.documentName, fileExtension: input.documentExtension || input.documentName.split(".").pop() || "pdf", documentId:"1" }],
    recipients:{ signers: input.recipients.map((r,i)=>({ email:r.email, name:r.name, recipientId:String(i+1), routingOrder:String(r.routingOrder || i+1), tabs:{ signHereTabs:[{ documentId:"1", pageNumber:"1", anchorString:"/sn1/", anchorIgnoreIfNotPresent:"true" }] } })) },
    status: input.sendImmediately===false ? "created" : "sent",
  });
  if(!provider.envelopeId) throw new Error(provider.message || "DocuSign did not return an envelope ID.");
  const now=new Date().toISOString();
  const insert=await admin.from("signature_envelopes").insert({
    organisation_id:input.organisationId,
    connection_id:context.connection.id,
    provider_key:"docusign",
    provider_envelope_id:provider.envelopeId,
    source_module:input.sourceModule,
    source_record_id:input.sourceRecordId,
    source_document_id:input.sourceDocumentId || null,
    document_name:input.documentName,
    recipient_summary:input.recipients,
    status:status(provider.status || (input.sendImmediately===false?"created":"sent")),
    provider_status:provider.status || null,
    sent_at:input.sendImmediately===false?null:now,
    metadata:{ email_subject:input.emailSubject, email_message:input.emailMessage || null, provider_uri:provider.uri || null },
    created_by_user_id:input.createdByUserId,
    created_at:now,
    updated_at:now,
  }).select("*").single();
  if(insert.error || !insert.data) throw new Error(insert.error?.message || "LEO could not record the DocuSign envelope.");
  await admin.from("connection_activity_history").insert({
    organisation_id:input.organisationId,
    performed_by_user_id:input.createdByUserId,
    provider_id:context.connection.provider_id,
    connection_id:context.connection.id,
    job_id:null,
    module_key:input.sourceModule,
    activity_type:"Signature Envelope Sent",
    activity_summary:`${input.documentName} was sent for signature.`,
    activity_details:{ envelope_id:provider.envelopeId, source_record_id:input.sourceRecordId, recipients:input.recipients },
  });
  return insert.data;
}

export async function refreshSignatureEnvelope(admin: SupabaseClient, organisationId: string, envelopeId: string) {
  const record=await admin.from("signature_envelopes").select("*").eq("organisation_id",organisationId).eq("provider_envelope_id",envelopeId).maybeSingle();
  if(record.error) throw new Error(record.error.message);
  if(!record.data) throw new Error("The signature envelope was not found.");
  const context=await getDocuSignContext(admin,organisationId,record.data.connection_id);
  const provider=await docuSignRequest<DocuSignEnvelopeStatusResponse>(context,`/envelopes/${encodeURIComponent(envelopeId)}`);
  const now=new Date().toISOString();
  const update=await admin.from("signature_envelopes").update({
    status:status(provider.status),
    provider_status:provider.status || null,
    sent_at:provider.sentDateTime || record.data.sent_at,
    delivered_at:provider.deliveredDateTime || record.data.delivered_at,
    completed_at:provider.completedDateTime || record.data.completed_at,
    declined_at:provider.declinedDateTime || record.data.declined_at,
    voided_at:provider.voidedDateTime || record.data.voided_at,
    expires_at:provider.expireDateTime || record.data.expires_at,
    last_status_checked_at:now,
    last_error_code:null,
    last_error_message:null,
    updated_at:now,
  }).eq("id",record.data.id).select("*").single();
  if(update.error || !update.data) throw new Error(update.error?.message || "The signature status could not be saved.");

  if (String(update.data.status || "").toLowerCase() === "completed") {
    try {
      const transferResult =
        await transferCompletedSignatureToEmployee(
          admin,
          organisationId,
          update.data,
        );

      const transferRecordedAt = new Date().toISOString();

      const recorded = await admin
        .from("signature_envelopes")
        .update({
          metadata: {
            ...(update.data.metadata || {}),
            employee_transfer_last_attempt_at: transferRecordedAt,
            employee_transfer_last_result: transferResult,
            employee_transfer_last_error: null,
          },
          last_error_code: null,
          last_error_message: null,
          updated_at: transferRecordedAt,
        })
        .eq("id", update.data.id)
        .select("*")
        .single();

      if (recorded.error || !recorded.data) {
        throw new Error(
          recorded.error?.message ||
            "The signed document transfer completed, but LEO could not record the result.",
        );
      }

      return {
        ...recorded.data,
        signatureTransfer: transferResult,
      };
    } catch (error) {
      const transferError =
        error instanceof Error
          ? error.message
          : "The signed document could not be transferred to the employee record.";

      const failedAt = new Date().toISOString();

      await admin
        .from("signature_envelopes")
        .update({
          metadata: {
            ...(update.data.metadata || {}),
            employee_transfer_status: "failed",
            employee_transfer_last_attempt_at: failedAt,
            employee_transfer_last_error: transferError,
          },
          last_error_code: "employee_document_transfer_failed",
          last_error_message: transferError,
          updated_at: failedAt,
        })
        .eq("id", update.data.id);

      throw new Error(
        `DocuSign shows the envelope as completed, but LEO could not add the signed document to the employee record: ${transferError}`,
      );
    }
  }

  return update.data;
}

export async function voidSignatureEnvelope(admin: SupabaseClient, organisationId: string, envelopeId: string, reason: string) {
  const record=await admin.from("signature_envelopes").select("*").eq("organisation_id",organisationId).eq("provider_envelope_id",envelopeId).maybeSingle();
  if(record.error) throw new Error(record.error.message);
  if(!record.data) throw new Error("The signature envelope was not found.");
  const context=await getDocuSignContext(admin,organisationId,record.data.connection_id);
  await docuSignRequest(context,`/envelopes/${encodeURIComponent(envelopeId)}`,"PUT",{status:"voided",voidedReason:reason});
  const now=new Date().toISOString();
  const update=await admin.from("signature_envelopes").update({status:"voided",provider_status:"voided",voided_at:now,updated_at:now,metadata:{...(record.data.metadata||{}),void_reason:reason}}).eq("id",record.data.id).select("*").single();
  if(update.error || !update.data) throw new Error(update.error?.message || "The envelope could not be voided.");
  return update.data;
}

export async function downloadEnvelopeDocuments(admin: SupabaseClient, organisationId: string, envelopeId: string) {
  const record=await admin.from("signature_envelopes").select("*").eq("organisation_id",organisationId).eq("provider_envelope_id",envelopeId).maybeSingle();
  if(record.error) throw new Error(record.error.message);
  if(!record.data) throw new Error("The signature envelope was not found.");
  const context=await getDocuSignContext(admin,organisationId,record.data.connection_id);
  return docuSignBinaryRequest(context,`/envelopes/${encodeURIComponent(envelopeId)}/documents/combined`);
}


export async function transferCompletedSignatureToEmployee(
  admin: SupabaseClient,
  organisationId: string,
  envelopeRecord: Record<string, any>,
  employeeId?: number | null,
) {
  if (
    String(envelopeRecord.status || "").toLowerCase() !== "completed" ||
    String(envelopeRecord.source_module || "") !== "Talent"
  ) {
    return { transferred: false, reason: "not_eligible" };
  }

  let resolvedEmployeeId = employeeId || null;

  if (!resolvedEmployeeId) {
    const appointment = await admin
      .from("leo_talent_appointments")
      .select("employee_id")
      .eq("organisation_id", organisationId)
      .eq("offer_id", envelopeRecord.source_record_id)
      .not("employee_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appointment.error) {
      throw new Error(appointment.error.message);
    }

    resolvedEmployeeId = appointment.data?.employee_id || null;
  }

  if (!resolvedEmployeeId) {
    await admin
      .from("signature_envelopes")
      .update({
        metadata: {
          ...(envelopeRecord.metadata || {}),
          employee_transfer_status: "pending_employee_creation",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", envelopeRecord.id);

    return { transferred: false, reason: "employee_not_created" };
  }

  const storagePath = `${resolvedEmployeeId}/docusign/${envelopeRecord.provider_envelope_id}-signed.pdf`;

  const existingDocument = await admin
    .from("employee_documents")
    .select("id,file_path")
    .eq("employee_id", resolvedEmployeeId)
    .eq("file_path", storagePath)
    .maybeSingle();

  if (existingDocument.error) {
    throw new Error(existingDocument.error.message);
  }

  if (existingDocument.data) {
    await admin
      .from("signature_envelopes")
      .update({
        completed_document_path: storagePath,
        metadata: {
          ...(envelopeRecord.metadata || {}),
          employee_transfer_status: "completed",
          employee_id: resolvedEmployeeId,
          employee_document_id: existingDocument.data.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", envelopeRecord.id);

    return {
      transferred: true,
      employeeId: resolvedEmployeeId,
      documentId: existingDocument.data.id,
      alreadyTransferred: true,
    };
  }

  const downloaded = await downloadEnvelopeDocuments(
    admin,
    organisationId,
    envelopeRecord.provider_envelope_id,
  );

  const upload = await admin.storage
    .from("employee-documents")
    .upload(storagePath, downloaded.data, {
      contentType: downloaded.contentType || "application/pdf",
      upsert: false,
    });

  if (upload.error) {
    throw new Error(
      `The signed document could not be stored on the employee record: ${upload.error.message}`,
    );
  }

  const fileName =
    downloaded.fileName ||
    `${String(envelopeRecord.document_name || "signed-offer").replace(/\.[^.]+$/, "")}-signed.pdf`;

  const completedAt =
    envelopeRecord.completed_at ||
    new Date().toISOString();

  const documentInsert = await admin
    .from("employee_documents")
    .insert({
      employee_id: resolvedEmployeeId,
      title: "Signed Offer of Employment",
      document_type: "Offer Letter",
      file_name: fileName,
      file_path: storagePath,
      file_type: downloaded.contentType || "application/pdf",
      notes: `Electronically signed via DocuSign. Envelope: ${envelopeRecord.provider_envelope_id}`,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (documentInsert.error || !documentInsert.data) {
    await admin.storage.from("employee-documents").remove([storagePath]);

    throw new Error(
      documentInsert.error?.message ||
        "The signed document file was stored but its employee document record could not be created.",
    );
  }

  const timelineExisting = await admin
    .from("employee_timeline")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("employee_id", resolvedEmployeeId)
    .eq("source_module", "DocuSign")
    .eq("source_record_id", envelopeRecord.provider_envelope_id)
    .maybeSingle();

  if (timelineExisting.error) {
    throw new Error(timelineExisting.error.message);
  }

  if (!timelineExisting.data) {
    const timelineInsert = await admin
      .from("employee_timeline")
      .insert({
        organisation_id: organisationId,
        employee_id: resolvedEmployeeId,
        event_type: "Document Signed",
        title: "Offer document electronically signed",
        description:
          "The offer document was electronically signed via DocuSign and added to the employee document record.",
        status: "Completed",
        source_module: "DocuSign",
        source_record_id: envelopeRecord.provider_envelope_id,
        metadata: {
          signature_envelope_id: envelopeRecord.id,
          provider_envelope_id: envelopeRecord.provider_envelope_id,
          employee_document_id: documentInsert.data.id,
          document_path: storagePath,
        },
        event_date: completedAt,
        created_by: envelopeRecord.created_by_user_id || null,
        created_at: new Date().toISOString(),
      });

    if (timelineInsert.error) {
      throw new Error(
        `The signed document was stored, but the employee timeline could not be updated: ${timelineInsert.error.message}`,
      );
    }
  }

  await admin
    .from("signature_envelopes")
    .update({
      completed_document_path: storagePath,
      metadata: {
        ...(envelopeRecord.metadata || {}),
        employee_transfer_status: "completed",
        employee_id: resolvedEmployeeId,
        employee_document_id: documentInsert.data.id,
        transferred_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", envelopeRecord.id);

  await admin
    .from("leo_talent_appointments")
    .update({
      documents_transferred: true,
      updated_at: new Date().toISOString(),
    })
    .eq("organisation_id", organisationId)
    .eq("offer_id", envelopeRecord.source_record_id)
    .eq("employee_id", resolvedEmployeeId);

  return {
    transferred: true,
    employeeId: resolvedEmployeeId,
    documentId: documentInsert.data.id,
    alreadyTransferred: false,
  };
}

export async function transferCompletedSignaturesForOffer(
  admin: SupabaseClient,
  organisationId: string,
  offerId: string,
  employeeId: number,
) {
  const envelopesResult = await admin
    .from("signature_envelopes")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("source_module", "Talent")
    .eq("source_record_id", offerId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (envelopesResult.error) {
    throw new Error(envelopesResult.error.message);
  }

  const results = [];

  for (const envelope of envelopesResult.data || []) {
    results.push(
      await transferCompletedSignatureToEmployee(
        admin,
        organisationId,
        envelope,
        employeeId,
      ),
    );
  }

  return results;
}

export async function resendSignatureEnvelope(
  admin: SupabaseClient,
  organisationId: string,
  envelopeId: string,
) {
  const record = await admin
    .from("signature_envelopes")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("provider_envelope_id", envelopeId)
    .maybeSingle();

  if (record.error) throw new Error(record.error.message);
  if (!record.data) throw new Error("The signature envelope was not found.");

  if (!["sent", "delivered"].includes(String(record.data.status || "").toLowerCase())) {
    throw new Error(
      "Only an envelope that is awaiting signature can have its signing email resent.",
    );
  }

  const context = await getDocuSignContext(
    admin,
    organisationId,
    record.data.connection_id,
  );

  const recipients = await docuSignRequest<{
    signers?: Array<{
      recipientId?: string;
      name?: string;
      email?: string;
      routingOrder?: string;
    }>;
  }>(
    context,
    `/envelopes/${encodeURIComponent(envelopeId)}/recipients`,
  );

  const signers = Array.isArray(recipients.signers)
    ? recipients.signers
        .filter((signer) => signer.recipientId && signer.name && signer.email)
        .map((signer) => ({
          recipientId: signer.recipientId,
          name: signer.name,
          email: signer.email,
          routingOrder: signer.routingOrder || "1",
        }))
    : [];

  if (!signers.length) {
    throw new Error("DocuSign did not return an eligible signer to notify.");
  }

  await docuSignRequest(
    context,
    `/envelopes/${encodeURIComponent(
      envelopeId,
    )}/recipients?resend_envelope=true`,
    "PUT",
    { signers },
  );

  const now = new Date().toISOString();
  const update = await admin
    .from("signature_envelopes")
    .update({
      metadata: {
        ...(record.data.metadata || {}),
        last_resent_at: now,
      },
      updated_at: now,
    })
    .eq("id", record.data.id)
    .select("*")
    .single();

  if (update.error || !update.data) {
    throw new Error(
      update.error?.message ||
        "The signing email was resent but LEO could not record the action.",
    );
  }

  return update.data;
}