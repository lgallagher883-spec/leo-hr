"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CompanyDocument = {
  id: number;
  name: string;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  created_at: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("company_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  }

  async function uploadDocument() {
    if (!name.trim()) {
      alert("Please enter a document name.");
      return;
    }

    if (!file) {
      alert("Please choose a document to upload.");
      return;
    }

    setUploading(true);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${Date.now()}-${safeFileName}`;

    const uploadResult = await supabase.storage
      .from("company-documents")
      .upload(filePath, file);

    if (uploadResult.error) {
      console.error(uploadResult.error);
      alert("Document could not be uploaded.");
      setUploading(false);
      return;
    }

    const publicUrlResult = supabase.storage
      .from("company-documents")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("company_documents").insert({
      name: name.trim(),
      notes: notes.trim() || null,
      file_name: file.name,
      file_path: filePath,
      file_url: publicUrlResult.data.publicUrl,
    });

    if (error) {
      console.error(error);
      alert("Document record could not be saved.");
      setUploading(false);
      return;
    }

    setName("");
    setNotes("");
    setFile(null);
    setShowForm(false);
    setUploading(false);

    await loadDocuments();
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Documents</h1>
          <p style={subtitleStyle}>
            Store company documents that are not policies or risk assessments.
          </p>
        </div>

        <button onClick={() => setShowForm(!showForm)} style={primaryButtonStyle}>
          + Upload
        </button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Upload Document</h2>

          <div style={formGridStyle}>
            <Field label="Document Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Staff Handbook"
              />
            </Field>

            <Field label="Document">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={inputStyle}
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
              />
            </Field>

            <Field label="Notes">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={inputStyle}
                placeholder="Optional notes"
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              onClick={uploadDocument}
              disabled={uploading}
              style={primaryButtonStyle}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>

            <button onClick={() => setShowForm(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {loading ? (
          <div style={emptyStyle}>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div style={emptyStyle}>No documents uploaded yet.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Uploaded</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Document</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={tdStyle}>
                    <strong>{doc.name}</strong>
                    {doc.file_name && (
                      <div style={smallTextStyle}>{doc.file_name}</div>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(doc.created_at)}</td>
                  <td style={tdStyle}>{doc.notes || "—"}</td>
                  <td style={tdStyle}>
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={openButtonStyle}
                      >
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  marginTop: "6px",
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "18px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#374151",
  border: "1px solid #E5E7EB",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #E5E7EB",
  color: "#374151",
  fontSize: "13px",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #F3F4F6",
  color: "#374151",
  fontSize: "14px",
};

const smallTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6B7280",
  marginTop: "2px",
};

const openButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
};

const emptyStyle: React.CSSProperties = {
  color: "#6B7280",
};