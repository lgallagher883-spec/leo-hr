"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SelectField from "./SelectField";
import SaveButton from "./SaveButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmployeeDocumentsProps = {
  employeeId: number;
};

type EmployeeDocument = {
  id: number;
  title: string;
  document_type: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  notes: string | null;
  created_at: string;
};

const documentTypes = [
  "Contract",
  "Offer Letter",
  "Right to Work",
  "DBS",
  "Driving",
  "Insurance",
  "Medical / Occupational Health",
  "Fit Note",
  "Return to Work",
  "Warning",
  "Grievance",
  "Disciplinary",
  "Performance",
  "Training",
  "Policy Acknowledgement",
  "Other",
];

export default function EmployeeDocuments({
  employeeId,
}: EmployeeDocumentsProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);

  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("Contract");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("employee_documents")
      .select(
        "id, title, document_type, file_name, file_path, file_type, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading employee documents:", error);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadDocuments();
  }, [employeeId]);

  async function uploadDocument() {
    if (!selectedFile) {
      setMessage("Please choose a file to upload.");
      return;
    }

    const documentTitle = title.trim() || selectedFile.name;

    setSaving(true);
    setMessage("");

    const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${employeeId}/${Date.now()}-${safeFileName}`;

    const upload = await supabase.storage
      .from("employee-documents")
      .upload(filePath, selectedFile);

    if (upload.error) {
      console.error("Error uploading document:", upload.error);
      setMessage("Document file could not be uploaded.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("employee_documents").insert([
      {
        employee_id: employeeId,
        title: documentTitle,
        document_type: documentType,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving document record:", error);
      setMessage("Document record could not be saved.");
      setSaving(false);
      return;
    }

    setTitle("");
    setDocumentType("Contract");
    setNotes("");
    setSelectedFile(null);
    setMessage("Document uploaded.");
    setSaving(false);
    loadDocuments();
  }

  async function openDocument(filePath: string) {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(filePath, 60);

    if (error) {
      console.error("Error opening document:", error);
      setMessage("Document could not be opened.");
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  return (
    <ProfileSection title="Documents">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Upload documents linked to this employee, such as contracts, right to
        work evidence, fit notes, DBS certificates, driving documents and HR
        letters.
      </p>

      <Field
        label="Document Title"
        value={title}
        onChange={setTitle}
        placeholder="Defaults to file name if left blank"
      />

      <SelectField
        label="Document Type"
        value={documentType}
        onChange={setDocumentType}
        options={documentTypes}
      />

      <Field
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional notes"
      />

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "5px",
          }}
        >
          File
        </label>

        <input
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setSelectedFile(file);
          }}
        />
      </div>

      <SaveButton onClick={uploadDocument} disabled={saving}>
        {saving ? "Uploading..." : "Upload document"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Document history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No documents uploaded yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {documents.map((document) => (
              <div
                key={document.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#F9FAFB",
                }}
              >
                <div style={{ fontWeight: 800 }}>{document.title}</div>

                <div
                  style={{
                    color: "#6B7280",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  {document.document_type || "Document"} · {document.file_name}
                </div>

                {document.notes && (
                  <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>
                    <strong>Notes:</strong> {document.notes}
                  </div>
                )}

                <button
                  onClick={() => openDocument(document.file_path)}
                  style={{
                    marginTop: "10px",
                    background: "#111827",
                    color: "#fff",
                    border: "none",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Open document
                </button>

                <div
                  style={{
                    color: "#6B7280",
                    fontSize: "12px",
                    marginTop: "10px",
                  }}
                >
                  Uploaded {new Date(document.created_at).toLocaleString("en-GB")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}