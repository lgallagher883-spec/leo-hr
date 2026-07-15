"use client";

import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { recordAuditLog } from "../../../../lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SarRequest = {
  id: number;
  employee_id: number;
  matter_id: number | null;
  request_title: string;
  request_summary: string | null;
  request_received_date: string;
  response_due_date: string;
  extended_due_date: string | null;
  status: string;
  request_source: string | null;
  request_file_name: string | null;
  request_file_path: string | null;
  request_file_type: string | null;
  request_file_size: number | null;
  assigned_to: string | null;
  scope_notes: string | null;
  extension_applied: boolean;
  extension_reason: string | null;
  identity_verified: boolean;
  identity_verified_at: string | null;
  collection_complete: boolean;
  review_complete: boolean;
  redaction_complete: boolean;
  disclosure_sent: boolean;
  disclosure_sent_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Employee = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
};

type Matter = {
  id: number;
  title: string;
  subject: string | null;
  status: string | null;
};

type SarDocument = {
  id: number;
  sar_id: number;
  employee_id: number;
  document_type: string;
  title: string;
  file_name: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  review_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TimelineEvent = {
  id: number;
  sar_id: number;
  event_type: string;
  title: string;
  description: string | null;
  created_by: string | null;
  event_date: string;
  created_at: string;
};

type ChecklistField =
  | "identity_verified"
  | "collection_complete"
  | "review_complete"
  | "redaction_complete"
  | "disclosure_sent";

const statusOptions = [
  "Received",
  "Scope Review",
  "Collecting Records",
  "Reviewing Records",
  "Redaction",
  "Ready for Disclosure",
  "Completed",
  "Closed",
];

const documentTypeOptions = [
  "Identity Evidence",
  "Collected Record",
  "Review Copy",
  "Redacted Copy",
  "Disclosure Pack",
  "Correspondence",
  "Other",
];

const reviewStatusOptions = [
  "Not Reviewed",
  "In Review",
  "Approved",
  "Requires Redaction",
  "Excluded",
  "Ready for Disclosure",
];

export default function SarDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const sarId = Number(params.id);

  const [sar, setSar] =
    useState<SarRequest | null>(null);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [matter, setMatter] =
    useState<Matter | null>(null);

  const [documents, setDocuments] =
    useState<SarDocument[]>([]);

  const [timeline, setTimeline] =
    useState<TimelineEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [status, setStatus] =
    useState("Received");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [scopeNotes, setScopeNotes] =
    useState("");

  const [
    extensionApplied,
    setExtensionApplied,
  ] = useState(false);

  const [
    extensionReason,
    setExtensionReason,
  ] = useState("");

  const [
    extendedDueDate,
    setExtendedDueDate,
  ] = useState("");

  const [
    documentType,
    setDocumentType,
  ] = useState("Collected Record");

  const [
    documentTitle,
    setDocumentTitle,
  ] = useState("");

  const [
    documentNotes,
    setDocumentNotes,
  ] = useState("");

  const [
    documentFile,
    setDocumentFile,
  ] = useState<File | null>(null);

  const [
    timelineTitle,
    setTimelineTitle,
  ] = useState("");

  const [
    timelineDescription,
    setTimelineDescription,
  ] = useState("");

  useEffect(() => {
    if (!Number.isFinite(sarId)) {
      setLoading(false);

      setErrorMessage(
        "The SAR reference is not valid."
      );

      return;
    }

    loadSar();
  }, [sarId]);

  async function loadSar() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("employee_sars")
        .select("*")
        .eq("id", sarId)
        .single();

    if (error || !data) {
      console.error(
        "Error loading SAR:",
        error
      );

      setErrorMessage(
        "The SAR request could not be found."
      );

      setLoading(false);
      return;
    }

    const loadedSar =
      data as SarRequest;

    setSar(loadedSar);
    setStatus(loadedSar.status);

    setAssignedTo(
      loadedSar.assigned_to || ""
    );

    setScopeNotes(
      loadedSar.scope_notes || ""
    );

    setExtensionApplied(
      loadedSar.extension_applied
    );

    setExtensionReason(
      loadedSar.extension_reason || ""
    );

    setExtendedDueDate(
      loadedSar.extended_due_date || ""
    );

    await Promise.all([
      loadEmployee(
        loadedSar.employee_id
      ),
      loadMatter(
        loadedSar.matter_id
      ),
      loadDocuments(),
      loadTimeline(),
    ]);

    setLoading(false);
  }

  async function loadEmployee(
    employeeId: number
  ) {
    const { data, error } =
      await supabase
        .from("employees")
        .select(
          "id,name,email,role"
        )
        .eq("id", employeeId)
        .single();

    if (error) {
      console.error(
        "Error loading employee:",
        error
      );

      return;
    }

    setEmployee(data);
  }

  async function loadMatter(
    matterId: number | null
  ) {
    if (!matterId) {
      setMatter(null);
      return;
    }

    const { data, error } =
      await supabase
        .from("matters")
        .select(
          "id,title,subject,status"
        )
        .eq("id", matterId)
        .single();

    if (error) {
      console.error(
        "Error loading Matter:",
        error
      );

      return;
    }

    setMatter(data);
  }

  async function loadDocuments() {
    const { data, error } =
      await supabase
        .from(
          "employee_sar_documents"
        )
        .select("*")
        .eq("sar_id", sarId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Error loading SAR documents:",
        error
      );

      return;
    }

    setDocuments(
      (data || []) as SarDocument[]
    );
  }

  async function loadTimeline() {
    const { data, error } =
      await supabase
        .from(
          "employee_sar_timeline"
        )
        .select("*")
        .eq("sar_id", sarId)
        .order("event_date", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Error loading SAR timeline:",
        error
      );

      return;
    }

    setTimeline(
      (data || []) as TimelineEvent[]
    );
  }

  async function addTimelineEvent({
    eventType,
    title,
    description,
    createdBy,
  }: {
    eventType: string;
    title: string;
    description?: string | null;
    createdBy?: string | null;
  }) {
    const { error } =
      await supabase
        .from(
          "employee_sar_timeline"
        )
        .insert({
          sar_id: sarId,
          event_type: eventType,
          title,
          description:
            description?.trim() ||
            null,
          created_by:
            createdBy?.trim() ||
            assignedTo.trim() ||
            "User",
        });

    if (error) {
      console.error(
        "Error saving SAR timeline:",
        error
      );

      throw error;
    }

    await loadTimeline();
  }

  async function saveSarDetails() {
    if (!sar) {
      return;
    }

    if (
      extensionApplied &&
      !extendedDueDate
    ) {
      setErrorMessage(
        "Enter the extended deadline."
      );

      return;
    }

    if (
      extensionApplied &&
      !extensionReason.trim()
    ) {
      setErrorMessage(
        "Record the reason for the extension."
      );

      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const previousValues = {
      status: sar.status,
      assigned_to:
        sar.assigned_to,
      scope_notes:
        sar.scope_notes,
      extension_applied:
        sar.extension_applied,
      extension_reason:
        sar.extension_reason,
      extended_due_date:
        sar.extended_due_date,
      closed_at:
        sar.closed_at,
    };

    const updateValues = {
      status,
      assigned_to:
        assignedTo.trim() || null,
      scope_notes:
        scopeNotes.trim() || null,
      extension_applied:
        extensionApplied,
      extension_reason:
        extensionApplied
          ? extensionReason.trim() ||
            null
          : null,
      extended_due_date:
        extensionApplied
          ? extendedDueDate || null
          : null,
      closed_at:
        status === "Closed" ||
        status === "Completed"
          ? sar.closed_at ||
            new Date().toISOString()
          : null,
    };

    const { data, error } =
      await supabase
        .from("employee_sars")
        .update(updateValues)
        .eq("id", sar.id)
        .select("*")
        .single();

    if (error || !data) {
      console.error(
        "Error updating SAR:",
        error
      );

      setErrorMessage(
        "The SAR details could not be saved."
      );

      setSaving(false);
      return;
    }

    const updatedSar =
      data as SarRequest;

    if (
      sar.status !== updatedSar.status
    ) {
      await addTimelineEvent({
        eventType:
          "status_changed",
        title:
          "SAR status updated",
        description:
          `Status changed from ${sar.status} to ${updatedSar.status}.`,
      });
    }

    await recordAuditLog({
      action:
        sar.status !==
        updatedSar.status
          ? "Subject Access Request status updated"
          : "Subject Access Request details updated",

      actionCategory: "SAR",

      entityType: "SAR",
      entityId: sar.id,

      entityName:
        sar.request_title,

      description:
        sar.status !==
        updatedSar.status
          ? `The Subject Access Request status was changed from ${sar.status} to ${updatedSar.status}.`
          : "The Subject Access Request details were updated.",

      previousValues,

      newValues: {
        status:
          updatedSar.status,
        assigned_to:
          updatedSar.assigned_to,
        scope_notes:
          updatedSar.scope_notes,
        extension_applied:
          updatedSar.extension_applied,
        extension_reason:
          updatedSar.extension_reason,
        extended_due_date:
          updatedSar.extended_due_date,
        closed_at:
          updatedSar.closed_at,
      },

      metadata: {
        employee_id:
          sar.employee_id,
        employee_name:
          employee?.name || null,
        matter_id:
          sar.matter_id,
        matter_name:
          matter?.subject ||
          matter?.title ||
          null,
      },

      sourcePage:
        `/dashboard/sar-requests/${sar.id}`,
    });

    setSar(updatedSar);

    setSuccessMessage(
      "SAR details saved."
    );

    setSaving(false);
  }

  async function toggleChecklist(
    field: ChecklistField,
    checked: boolean
  ) {
    if (!sar) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const previousValue =
      Boolean(sar[field]);

    const additionalValues: Record<
      string,
      unknown
    > = {};

    if (
      field ===
      "identity_verified"
    ) {
      additionalValues.identity_verified_at =
        checked
          ? new Date().toISOString()
          : null;
    }

    if (
      field ===
      "disclosure_sent"
    ) {
      additionalValues.disclosure_sent_at =
        checked
          ? new Date().toISOString()
          : null;
    }

    const { data, error } =
      await supabase
        .from("employee_sars")
        .update({
          [field]: checked,
          ...additionalValues,
        })
        .eq("id", sar.id)
        .select("*")
        .single();

    if (error || !data) {
      console.error(
        "Error updating SAR progress:",
        error
      );

      setErrorMessage(
        "The progress item could not be updated."
      );

      return;
    }

    const updatedSar =
      data as SarRequest;

    setSar(updatedSar);

    const progressTitle =
      getChecklistTitle(
        field,
        checked
      );

    await addTimelineEvent({
      eventType:
        "progress_updated",
      title: progressTitle,
      description: checked
        ? "The progress item was marked complete."
        : "The progress item was reopened.",
    });

    await recordAuditLog({
      action:
        checked
          ? "SAR progress stage completed"
          : "SAR progress stage reopened",

      actionCategory: "SAR",

      entityType: "SAR",
      entityId: sar.id,

      entityName:
        sar.request_title,

      description:
        `${getChecklistLabel(
          field
        )} was ${
          checked
            ? "marked complete"
            : "reopened"
        }.`,

      previousValues: {
        [field]:
          previousValue,
      },

      newValues: {
        [field]: checked,
      },

      metadata: {
        progress_stage:
          getChecklistLabel(
            field
          ),
        employee_id:
          sar.employee_id,
        employee_name:
          employee?.name || null,
      },

      sourcePage:
        `/dashboard/sar-requests/${sar.id}`,
    });

    setSuccessMessage(
      checked
        ? "Progress stage completed."
        : "Progress stage reopened."
    );
  }

  async function uploadDocument() {
    if (
      !sar ||
      !documentFile
    ) {
      setErrorMessage(
        "Select a document to upload."
      );

      return;
    }

    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const fileBeingUploaded =
        documentFile;

      const documentName =
        documentTitle.trim() ||
        fileBeingUploaded.name;

      const safeFileName =
        fileBeingUploaded.name
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          );

      const filePath =
        `sar-requests/${sar.employee_id}/${sar.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("hr-resources")
          .upload(
            filePath,
            fileBeingUploaded,
            {
              upsert: false,
              contentType:
                fileBeingUploaded.type ||
                "application/octet-stream",
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: documentRecord,
        error: recordError,
      } = await supabase
        .from(
          "employee_sar_documents"
        )
        .insert({
          sar_id: sar.id,
          employee_id:
            sar.employee_id,
          document_type:
            documentType,
          title:
            documentName,
          file_name:
            fileBeingUploaded.name,
          file_path:
            filePath,
          file_type:
            fileBeingUploaded.type ||
            null,
          file_size:
            fileBeingUploaded.size,
          review_status:
            "Not Reviewed",
          notes:
            documentNotes.trim() ||
            null,
        })
        .select("*")
        .single();

      if (
        recordError ||
        !documentRecord
      ) {
        await supabase.storage
          .from("hr-resources")
          .remove([filePath]);

        throw (
          recordError ||
          new Error(
            "The document record was not created."
          )
        );
      }

      await addTimelineEvent({
        eventType:
          "document_uploaded",
        title:
          "SAR document added",
        description:
          `${documentType}: ${documentName}`,
      });

      await recordAuditLog({
        action:
          "SAR document uploaded",

        actionCategory:
          "Document",

        entityType: "SAR",
        entityId: sar.id,

        entityName:
          sar.request_title,

        description:
          `${documentName} was added to the Subject Access Request.`,

        newValues: {
          document_id:
            documentRecord.id,
          document_type:
            documentType,
          title:
            documentName,
          file_name:
            fileBeingUploaded.name,
          file_type:
            fileBeingUploaded.type ||
            null,
          file_size:
            fileBeingUploaded.size,
          review_status:
            "Not Reviewed",
          notes:
            documentNotes.trim() ||
            null,
        },

        metadata: {
          sar_id: sar.id,
          employee_id:
            sar.employee_id,
          employee_name:
            employee?.name || null,
        },

        sourcePage:
          `/dashboard/sar-requests/${sar.id}`,
      });

      setDocumentFile(null);
      setDocumentTitle("");
      setDocumentNotes("");

      setDocumentType(
        "Collected Record"
      );

      const fileInput =
        document.getElementById(
          "sar-document-upload"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();

      setSuccessMessage(
        "Document uploaded."
      );
    } catch (error) {
      console.error(
        "Error uploading SAR document:",
        error
      );

      setErrorMessage(
        "The document could not be uploaded."
      );
    } finally {
      setUploading(false);
    }
  }

  async function updateDocumentStatus(
    documentId: number,
    reviewStatus: string
  ) {
    if (!sar) {
      return;
    }

    const existingDocument =
      documents.find(
        (item) =>
          item.id ===
          documentId
      );

    if (!existingDocument) {
      setErrorMessage(
        "The document could not be found."
      );

      return;
    }

    const { error } =
      await supabase
        .from(
          "employee_sar_documents"
        )
        .update({
          review_status:
            reviewStatus,
        })
        .eq(
          "id",
          documentId
        );

    if (error) {
      console.error(
        "Error updating document:",
        error
      );

      setErrorMessage(
        "The document status could not be updated."
      );

      return;
    }

    await addTimelineEvent({
      eventType:
        "document_review_updated",
      title:
        "Document review status updated",
      description:
        `${existingDocument.title} was marked as ${reviewStatus}.`,
    });

    await recordAuditLog({
      action:
        "SAR document review status updated",

      actionCategory:
        "Document",

      entityType:
        "SAR Document",

      entityId:
        documentId,

      entityName:
        existingDocument.title,

      description:
        `${existingDocument.title} was changed from ${existingDocument.review_status} to ${reviewStatus}.`,

      previousValues: {
        review_status:
          existingDocument.review_status,
      },

      newValues: {
        review_status:
          reviewStatus,
      },

      metadata: {
        sar_id: sar.id,
        sar_title:
          sar.request_title,
        employee_id:
          sar.employee_id,
      },

      sourcePage:
        `/dashboard/sar-requests/${sar.id}`,
    });

    await loadDocuments();

    setSuccessMessage(
      "Document review status updated."
    );
  }

  async function openDocument(
    filePath: string | null
  ) {
    if (!filePath) {
      setErrorMessage(
        "This document does not have a stored file."
      );

      return;
    }

    const { data, error } =
      await supabase.storage
        .from("hr-resources")
        .createSignedUrl(
          filePath,
          60 * 10
        );

    if (
      error ||
      !data?.signedUrl
    ) {
      console.error(
        "Error opening SAR document:",
        error
      );

      setErrorMessage(
        "The document could not be opened."
      );

      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function deleteDocument(
    documentItem: SarDocument
  ) {
    if (!sar) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${documentItem.title}" from this SAR?`
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      documentItem.file_path
    ) {
      const {
        error: storageError,
      } = await supabase.storage
        .from("hr-resources")
        .remove([
          documentItem.file_path,
        ]);

      if (storageError) {
        console.error(
          "Error deleting stored file:",
          storageError
        );
      }
    }

    const { error } =
      await supabase
        .from(
          "employee_sar_documents"
        )
        .delete()
        .eq(
          "id",
          documentItem.id
        );

    if (error) {
      console.error(
        "Error deleting SAR document:",
        error
      );

      setErrorMessage(
        "The document could not be removed."
      );

      return;
    }

    await addTimelineEvent({
      eventType:
        "document_removed",
      title:
        "SAR document removed",
      description:
        documentItem.title,
    });

    await recordAuditLog({
      action:
        "SAR document removed",

      actionCategory:
        "Document",

      entityType:
        "SAR Document",

      entityId:
        documentItem.id,

      entityName:
        documentItem.title,

      description:
        `${documentItem.title} was removed from the Subject Access Request.`,

      previousValues: {
        document_type:
          documentItem.document_type,
        title:
          documentItem.title,
        file_name:
          documentItem.file_name,
        file_type:
          documentItem.file_type,
        file_size:
          documentItem.file_size,
        review_status:
          documentItem.review_status,
        notes:
          documentItem.notes,
      },

      metadata: {
        sar_id: sar.id,
        sar_title:
          sar.request_title,
        employee_id:
          sar.employee_id,
      },

      sourcePage:
        `/dashboard/sar-requests/${sar.id}`,
    });

    await loadDocuments();

    setSuccessMessage(
      "Document removed."
    );
  }

  async function saveManualTimelineEntry() {
    if (!sar) {
      return;
    }

    if (
      !timelineTitle.trim()
    ) {
      setErrorMessage(
        "Enter a chronology title."
      );

      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const savedTitle =
      timelineTitle.trim();

    const savedDescription =
      timelineDescription.trim() ||
      null;

    try {
      await addTimelineEvent({
        eventType:
          "manual_entry",
        title: savedTitle,
        description:
          savedDescription,
      });

      await recordAuditLog({
        action:
          "SAR chronology entry added",

        actionCategory: "SAR",

        entityType: "SAR",
        entityId: sar.id,

        entityName:
          sar.request_title,

        description:
          savedDescription ||
          savedTitle,

        newValues: {
          title:
            savedTitle,
          description:
            savedDescription,
          created_by:
            assignedTo.trim() ||
            "User",
        },

        metadata: {
          employee_id:
            sar.employee_id,
          employee_name:
            employee?.name || null,
          matter_id:
            sar.matter_id,
        },

        sourcePage:
          `/dashboard/sar-requests/${sar.id}`,
      });

      setTimelineTitle("");
      setTimelineDescription("");

      setSuccessMessage(
        "Chronology entry added."
      );
    } catch (error) {
      console.error(
        "Error adding chronology entry:",
        error
      );

      setErrorMessage(
        "The chronology entry could not be added."
      );
    }
  }

  const effectiveDeadline =
    useMemo(
      () =>
        sar
          ? sar.extended_due_date ||
            sar.response_due_date
          : "",
      [sar]
    );

  const deadlineState =
    useMemo(
      () =>
        sar
          ? getDeadlineState(
              effectiveDeadline,
              sar.status
            )
          : "On Track",
      [
        effectiveDeadline,
        sar,
      ]
    );

  const progressCompleted =
    useMemo(
      () =>
        sar
          ? [
              sar.identity_verified,
              sar.collection_complete,
              sar.review_complete,
              sar.redaction_complete,
              sar.disclosure_sent,
            ].filter(Boolean)
              .length
          : 0,
      [sar]
    );  
    if (loading) {
    return (
      <div>
        Loading SAR request...
      </div>
    );
  }

  if (!sar) {
    return (
      <div style={pageStyle}>
        <button
          onClick={() =>
            router.push(
              "/dashboard/sar-requests"
            )
          }
          style={backButtonStyle}
        >
          ← SAR Requests
        </button>

        <div style={errorStyle}>
          {errorMessage ||
            "SAR request not found."}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button
        onClick={() =>
          router.push(
            "/dashboard/sar-requests"
          )
        }
        style={backButtonStyle}
      >
        ← SAR Requests
      </button>

      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            Subject Access Request
          </div>

          <h1 style={titleStyle}>
            {sar.request_title}
          </h1>

          <div style={headerMetaStyle}>
            <button
              onClick={() =>
                router.push(
                  `/dashboard/employees/${sar.employee_id}`
                )
              }
              style={textLinkStyle}
            >
              {employee?.name ||
                "Employee"}
            </button>

            <span>·</span>

            <span>
              Received{" "}
              {formatDate(
                sar.request_received_date
              )}
            </span>

            {matter && (
              <>
                <span>·</span>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/matters/${matter.id}`
                    )
                  }
                  style={textLinkStyle}
                >
                  {matter.subject ||
                    matter.title}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={headerStatusStyle}>
          <span
            style={{
              ...deadlineBadgeStyle,
              ...getDeadlineStyle(
                deadlineState
              ),
            }}
          >
            {deadlineState}
          </span>

          <span
            style={{
              ...statusBadgeStyle,
              ...getStatusStyle(
                sar.status
              ),
            }}
          >
            {sar.status}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={successStyle}>
          {successMessage}
        </div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Response deadline"
          value={formatDate(
            effectiveDeadline
          )}
          detail={deadlineState}
          attention={
            deadlineState ===
              "Overdue" ||
            deadlineState ===
              "Due Soon"
          }
        />

        <SummaryCard
          label="Progress"
          value={`${progressCompleted} of 5`}
          detail="Core stages complete"
        />

        <SummaryCard
          label="Owner"
          value={
            sar.assigned_to ||
            "Not assigned"
          }
          detail="SAR coordinator"
        />

        <SummaryCard
          label="Linked Matter"
          value={
            matter?.subject ||
            matter?.title ||
            "None"
          }
          detail={
            matter
              ? matter.status ||
                "Matter linked"
              : "Standalone SAR"
          }
        />
      </div>

      <div style={layoutStyle}>
        <main style={mainColumnStyle}>
          <Panel
            title="SAR progress"
            subtitle="Track the main stages from receipt through to disclosure."
          >
            <div
              style={checklistGridStyle}
            >
              <ChecklistItem
                label="Identity verified"
                description="Confirm the requester’s identity where verification is necessary."
                checked={
                  sar.identity_verified
                }
                onChange={(checked) =>
                  toggleChecklist(
                    "identity_verified",
                    checked
                  )
                }
              />

              <ChecklistItem
                label="Records collected"
                description="Confirm that relevant records have been gathered from the identified sources."
                checked={
                  sar.collection_complete
                }
                onChange={(checked) =>
                  toggleChecklist(
                    "collection_complete",
                    checked
                  )
                }
              />

              <ChecklistItem
                label="Records reviewed"
                description="Confirm the collected material has been reviewed for relevance and disclosure."
                checked={
                  sar.review_complete
                }
                onChange={(checked) =>
                  toggleChecklist(
                    "review_complete",
                    checked
                  )
                }
              />

              <ChecklistItem
                label="Redaction complete"
                description="Confirm personal information relating to others and any excluded material has been handled."
                checked={
                  sar.redaction_complete
                }
                onChange={(checked) =>
                  toggleChecklist(
                    "redaction_complete",
                    checked
                  )
                }
              />

              <ChecklistItem
                label="Disclosure sent"
                description="Confirm the final response and disclosure material have been issued."
                checked={
                  sar.disclosure_sent
                }
                onChange={(checked) =>
                  toggleChecklist(
                    "disclosure_sent",
                    checked
                  )
                }
              />
            </div>
          </Panel>

          <Panel
            title="Request and scope"
            subtitle="Record what has been requested and how the search will be approached."
          >
            <InfoGrid>
              <Info
                label="Employee"
                value={
                  employee?.name ||
                  "Unknown employee"
                }
              />

              <Info
                label="Request source"
                value={
                  sar.request_source ||
                  "Not recorded"
                }
              />

              <Info
                label="Original deadline"
                value={formatDate(
                  sar.response_due_date
                )}
              />

              <Info
                label="Original request"
                value={
                  sar.request_file_name ||
                  "No file uploaded"
                }
              />
            </InfoGrid>

            {sar.request_summary && (
              <div
                style={contentBlockStyle}
              >
                <div
                  style={contentLabelStyle}
                >
                  Request summary
                </div>

                <div
                  style={contentTextStyle}
                >
                  {sar.request_summary}
                </div>
              </div>
            )}

            <Field label="Scope notes">
              <textarea
                value={scopeNotes}
                onChange={(event) =>
                  setScopeNotes(
                    event.target.value
                  )
                }
                placeholder="Record the agreed scope, likely record sources, date ranges, search terms and any clarification received."
                style={textareaStyle}
              />
            </Field>

            {sar.request_file_path && (
              <button
                onClick={() =>
                  openDocument(
                    sar.request_file_path
                  )
                }
                style={
                  secondaryButtonStyle
                }
              >
                View original request
              </button>
            )}
          </Panel>

          <Panel
            title="Documents and records"
            subtitle="Upload, review and prepare the records connected to this SAR."
          >
            <div style={uploadCardStyle}>
              <div style={twoColumnStyle}>
                <Field label="Document type">
                  <select
                    value={documentType}
                    onChange={(event) =>
                      setDocumentType(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    {documentTypeOptions.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Document title">
                  <input
                    value={documentTitle}
                    onChange={(event) =>
                      setDocumentTitle(
                        event.target.value
                      )
                    }
                    placeholder="Optional title"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={documentNotes}
                  onChange={(event) =>
                    setDocumentNotes(
                      event.target.value
                    )
                  }
                  placeholder="Record where the document came from or why it is relevant."
                  style={{
                    ...textareaStyle,
                    minHeight: "72px",
                  }}
                />
              </Field>

              <Field label="Select file">
                <input
                  id="sar-document-upload"
                  type="file"
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>
                  ) =>
                    setDocumentFile(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  style={fileInputStyle}
                />

                {documentFile && (
                  <div
                    style={selectedFileStyle}
                  >
                    {documentFile.name} ·{" "}
                    {formatFileSize(
                      documentFile.size
                    )}
                  </div>
                )}
              </Field>

              <button
                onClick={uploadDocument}
                disabled={uploading}
                style={{
                  ...primaryButtonStyle,
                  opacity: uploading
                    ? 0.65
                    : 1,
                  cursor: uploading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {uploading
                  ? "Uploading..."
                  : "Upload document"}
              </button>
            </div>

            {documents.length === 0 ? (
              <MutedText>
                No documents have been
                added to this SAR yet.
              </MutedText>
            ) : (
              <div
                style={documentListStyle}
              >
                {documents.map(
                  (documentItem) => (
                    <div
                      key={documentItem.id}
                      style={
                        documentCardStyle
                      }
                    >
                      <div
                        style={
                          documentHeaderStyle
                        }
                      >
                        <div>
                          <div
                            style={
                              documentTitleStyle
                            }
                          >
                            {
                              documentItem.title
                            }
                          </div>

                          <div
                            style={
                              documentMetaStyle
                            }
                          >
                            {
                              documentItem.document_type
                            }

                            {documentItem.file_size
                              ? ` · ${formatFileSize(
                                  documentItem.file_size
                                )}`
                              : ""}

                            {` · Added ${formatDateTime(
                              documentItem.created_at
                            )}`}
                          </div>
                        </div>

                        <span
                          style={{
                            ...reviewBadgeStyle,
                            ...getReviewStatusStyle(
                              documentItem.review_status
                            ),
                          }}
                        >
                          {
                            documentItem.review_status
                          }
                        </span>
                      </div>

                      {documentItem.notes && (
                        <div
                          style={
                            documentNotesStyle
                          }
                        >
                          {documentItem.notes}
                        </div>
                      )}

                      <div
                        style={
                          documentActionRowStyle
                        }
                      >
                        <select
                          value={
                            documentItem.review_status
                          }
                          onChange={(event) =>
                            updateDocumentStatus(
                              documentItem.id,
                              event.target.value
                            )
                          }
                          style={
                            compactSelectStyle
                          }
                        >
                          {reviewStatusOptions.map(
                            (option) => (
                              <option
                                key={option}
                                value={option}
                              >
                                {option}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          onClick={() =>
                            openDocument(
                              documentItem.file_path
                            )
                          }
                          style={
                            smallButtonStyle
                          }
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            deleteDocument(
                              documentItem
                            )
                          }
                          style={
                            dangerSmallButtonStyle
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </Panel>

          <Panel
            title="Chronology"
            subtitle="Maintain a clear record of actions and decisions throughout the request."
          >
            <div style={manualEntryStyle}>
              <input
                value={timelineTitle}
                onChange={(event) =>
                  setTimelineTitle(
                    event.target.value
                  )
                }
                placeholder="Chronology entry title"
                style={inputStyle}
              />

              <textarea
                value={
                  timelineDescription
                }
                onChange={(event) =>
                  setTimelineDescription(
                    event.target.value
                  )
                }
                placeholder="Brief factual description..."
                style={{
                  ...textareaStyle,
                  minHeight: "72px",
                }}
              />

              <button
                onClick={
                  saveManualTimelineEntry
                }
                style={
                  secondaryButtonStyle
                }
              >
                Add chronology entry
              </button>
            </div>

            {timeline.length === 0 ? (
              <MutedText>
                No chronology entries
                have been recorded.
              </MutedText>
            ) : (
              <div
                style={timelineListStyle}
              >
                {timeline.map(
                  (event) => (
                    <div
                      key={event.id}
                      style={
                        timelineItemStyle
                      }
                    >
                      <div
                        style={
                          timelineMarkerStyle
                        }
                      />

                      <div>
                        <div
                          style={
                            timelineTitleStyle
                          }
                        >
                          {event.title}
                        </div>

                        <div
                          style={
                            timelineMetaStyle
                          }
                        >
                          {formatDateTime(
                            event.event_date
                          )}

                          {event.created_by
                            ? ` · ${event.created_by}`
                            : ""}
                        </div>

                        {event.description && (
                          <div
                            style={
                              timelineDescriptionStyle
                            }
                          >
                            {
                              event.description
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </Panel>
        </main>

        <aside style={sideColumnStyle}>
          <Panel title="Manage SAR">
            <Field label="Status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {statusOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Owner">
              <input
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value
                  )
                }
                placeholder="SAR coordinator"
                style={inputStyle}
              />
            </Field>

            <label
              style={
                extensionToggleStyle
              }
            >
              <input
                type="checkbox"
                checked={
                  extensionApplied
                }
                onChange={(event) =>
                  setExtensionApplied(
                    event.target.checked
                  )
                }
              />

              Extension applied
            </label>

            {extensionApplied && (
              <>
                <Field
                  label="Extended deadline"
                  required
                >
                  <input
                    type="date"
                    value={
                      extendedDueDate
                    }
                    onChange={(event) =>
                      setExtendedDueDate(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Extension reason"
                  required
                >
                  <textarea
                    value={
                      extensionReason
                    }
                    onChange={(event) =>
                      setExtensionReason(
                        event.target.value
                      )
                    }
                    placeholder="Record why the extension applies and when the requester was informed."
                    style={{
                      ...textareaStyle,
                      minHeight: "88px",
                    }}
                  />
                </Field>
              </>
            )}

            <button
              onClick={saveSarDetails}
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                width: "100%",
                opacity: saving
                  ? 0.65
                  : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : "Save SAR"}
            </button>
          </Panel>

          <Panel title="Leo and this SAR">
            <p style={guidanceTextStyle}>
              Leo can help clarify the
              scope, identify likely
              record sources, track the
              deadline and work through
              review, redaction and
              disclosure.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/ask-leo?sarId=${sar.id}`
                )
              }
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Ask Leo about this SAR
            </button>
          </Panel>

          <Panel title="Employee">
            <Info
              label="Name"
              value={
                employee?.name ||
                "Unknown employee"
              }
            />

            <Info
              label="Role"
              value={
                employee?.role ||
                "Not recorded"
              }
            />

            <Info
              label="Email"
              value={
                employee?.email ||
                "Not recorded"
              }
            />

            <button
              onClick={() =>
                router.push(
                  `/dashboard/employees/${sar.employee_id}`
                )
              }
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open employee profile
            </button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <h2 style={panelTitleStyle}>
          {title}
        </h2>

        {subtitle && (
          <p style={panelSubtitleStyle}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  attention = false,
}: {
  label: string;
  value: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div
      style={{
        ...summaryCardStyle,
        ...(attention
          ? summaryAttentionStyle
          : {}),
      }}
    >
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryDetailStyle}>
        {detail}
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label
      style={{
        ...checklistItemStyle,
        ...(checked
          ? checklistCompleteStyle
          : {}),
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        style={checkboxStyle}
      />

      <div>
        <div
          style={checklistLabelStyle}
        >
          {label}
        </div>

        <div
          style={
            checklistDescriptionStyle
          }
        >
          {description}
        </div>
      </div>
    </label>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label}
        {required ? " *" : ""}
      </label>

      {children}
    </div>
  );
}

function InfoGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div style={infoGridStyle}>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoStyle}>
      <div style={infoLabelStyle}>
        {label}
      </div>

      <div style={infoValueStyle}>
        {value}
      </div>
    </div>
  );
}

function MutedText({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div style={mutedTextStyle}>
      {children}
    </div>
  );
}

function getChecklistLabel(
  field: ChecklistField
): string {
  switch (field) {
    case "identity_verified":
      return "Identity verification";

    case "collection_complete":
      return "Records collection";

    case "review_complete":
      return "Records review";

    case "redaction_complete":
      return "Redaction";

    case "disclosure_sent":
      return "Disclosure";
  }
}

function getChecklistTitle(
  field: ChecklistField,
  checked: boolean
) {
  const state = checked
    ? "completed"
    : "reopened";

  return `${getChecklistLabel(
    field
  )} ${state}`;
}

function getDeadlineState(
  deadlineString: string,
  status: string
):
  | "Completed"
  | "Overdue"
  | "Due Soon"
  | "On Track" {
  if (
    status === "Completed" ||
    status === "Closed"
  ) {
    return "Completed";
  }

  const deadline = new Date(
    `${deadlineString}T23:59:59`
  );

  const now = new Date();

  const days = Math.ceil(
    (deadline.getTime() -
      now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return "Overdue";
  }

  if (days <= 7) {
    return "Due Soon";
  }

  return "On Track";
}

function getDeadlineStyle(
  state:
    | "Completed"
    | "Overdue"
    | "Due Soon"
    | "On Track"
): React.CSSProperties {
  if (state === "Overdue") {
    return {
      background: "#FEF2F2",
      color: "#991B1B",
    };
  }

  if (state === "Due Soon") {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
    };
  }

  if (state === "Completed") {
    return {
      background: "#F3F4F6",
      color: "#374151",
    };
  }

  return {
    background: "#F0FDF4",
    color: "#166534",
  };
}

function getStatusStyle(
  status: string
): React.CSSProperties {
  if (
    status === "Completed" ||
    status === "Closed"
  ) {
    return {
      background: "#F3F4F6",
      color: "#374151",
    };
  }

  if (
    status ===
    "Ready for Disclosure"
  ) {
    return {
      background: "#F0FDF4",
      color: "#166534",
    };
  }

  if (
    status === "Redaction" ||
    status === "Reviewing Records"
  ) {
    return {
      background: "#F5F3FF",
      color: "#6D28D9",
    };
  }

  if (
    status ===
    "Collecting Records"
  ) {
    return {
      background: "#EFF6FF",
      color: "#1D4ED8",
    };
  }

  return {
    background: "#FFFBEB",
    color: "#92400E",
  };
}

function getReviewStatusStyle(
  status: string
): React.CSSProperties {
  if (
    status === "Approved" ||
    status ===
      "Ready for Disclosure"
  ) {
    return {
      background: "#F0FDF4",
      color: "#166534",
    };
  }

  if (
    status === "Excluded" ||
    status ===
      "Requires Redaction"
  ) {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
    };
  }

  if (status === "In Review") {
    return {
      background: "#EFF6FF",
      color: "#1D4ED8",
    };
  }

  return {
    background: "#F3F4F6",
    color: "#4B5563",
  };
}

function formatDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.round(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1400px",
};

const backButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6B7280",
  padding: 0,
  marginBottom: "16px",
  cursor: "pointer",
  fontSize: "14px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "18px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "27px",
  fontWeight: 700,
};

const headerMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "7px",
  color: "#6B7280",
  fontSize: "13px",
  marginTop: "9px",
};

const headerStatusStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const textLinkStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#6E5084",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "15px",
};

const summaryAttentionStyle: React.CSSProperties = {
  background: "#FFFBFB",
  borderColor: "#FECACA",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  marginBottom: "7px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const summaryDetailStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginTop: "5px",
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 310px",
  gap: "18px",
  alignItems: "start",
};

const mainColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
  minWidth: 0,
};

const sideColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
  position: "sticky",
  top: "18px",
};

const panelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "20px",
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: "16px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
  fontWeight: 700,
};

const panelSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const checklistGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const checklistItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "22px 1fr",
  gap: "10px",
  alignItems: "start",
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
  background: "#FFFFFF",
  cursor: "pointer",
};

const checklistCompleteStyle: React.CSSProperties = {
  background: "#F7FFF9",
  borderColor: "#BBF7D0",
};

const checkboxStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  marginTop: "2px",
  accentColor: "#6E5084",
};

const checklistLabelStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const checklistDescriptionStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "3px",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const infoStyle: React.CSSProperties = {
  padding: "11px",
  background: "#F9FAFB",
  borderRadius: "10px",
};

const infoLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginBottom: "4px",
};

const infoValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
  wordBreak: "break-word",
};

const contentBlockStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: "13px",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const contentLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginBottom: "6px",
};

const contentTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  padding: "10px 11px",
  color: "#111827",
  fontSize: "13px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "108px",
  resize: "vertical",
  fontFamily: "inherit",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const uploadCardStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FAFAFA",
  marginBottom: "16px",
};

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: "12px",
  color: "#4B5563",
};

const selectedFileStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "8px 9px",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#4B5563",
  fontSize: "11px",
};

const documentListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const documentCardStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
  padding: "13px",
};

const documentHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent:
    "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const documentTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const documentMetaStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "10px",
  marginTop: "4px",
};

const documentNotesStyle: React.CSSProperties = {
  color: "#4B5563",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "10px",
};

const documentActionRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "11px",
};

const compactSelectStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "6px 8px",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "11px",
};

const smallButtonStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "#FFFFFF",
  color: "#374151",
  padding: "6px 9px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerSmallButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: "#991B1B",
  borderColor: "#FECACA",
};

const reviewBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "4px 7px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const manualEntryStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
  marginBottom: "18px",
};

const timelineListStyle: React.CSSProperties = {
  display: "grid",
  gap: "13px",
};

const timelineItemStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns:
    "14px 1fr",
  gap: "9px",
};

const timelineMarkerStyle: React.CSSProperties = {
  width: "9px",
  height: "9px",
  marginTop: "4px",
  borderRadius: "50%",
  background: "#6E5084",
};

const timelineTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "12px",
  fontWeight: 700,
};

const timelineMetaStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "10px",
  marginTop: "3px",
};

const timelineDescriptionStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "5px",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 13px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "9px 12px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const extensionToggleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "14px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const deadlineBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const guidanceTextStyle: React.CSSProperties = {
  color: "#5F5368",
  fontSize: "12px",
  lineHeight: 1.6,
  margin: "0 0 14px",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  padding: "12px 0",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: "11px 12px",
  border: "1px solid #FECACA",
  borderRadius: "10px",
  background: "#FEF2F2",
  color: "#991B1B",
  fontSize: "12px",
};

const successStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: "11px 12px",
  border: "1px solid #BBF7D0",
  borderRadius: "10px",
  background: "#F0FDF4",
  color: "#166534",
  fontSize: "12px",
};