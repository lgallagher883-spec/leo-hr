"use client";

import { FileText } from "lucide-react";

export type SharedDocumentRecord = {
  id: string;
  title: string;
  category: string;
  uploadedAt: string;
  uploadedBy?: string;
  notes?: string;
  fileName?: string;
};

export type SharedDocumentsDetailsProps = {
  documents?: SharedDocumentRecord[];
};

export default function SharedDocumentsDetails({
  documents = [],
}: SharedDocumentsDetailsProps) {
  return (
    <section
      style={{
        border: "1px solid #E7DDED",
        borderRadius: 16,
        background: "#fff",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <FileText size={22} color="#6E5084" />
        <div>
          <h2 style={{ margin: 0 }}>Shared Documents</h2>
          <p style={{ margin: "4px 0 0", color: "#666" }}>
            Documents available across the Talent workspace.
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div
          style={{
            padding: 24,
            border: "1px dashed #D8CBE2",
            borderRadius: 12,
            textAlign: "center",
            color: "#666",
          }}
        >
          No shared documents have been added.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Category</th>
              <th align="left">Uploaded</th>
              <th align="left">By</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td>{doc.category}</td>
                <td>{doc.uploadedAt}</td>
                <td>{doc.uploadedBy ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}