"use client";

import { FileSignature, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { SignatureRecipient, SignatureSourceModule } from "@/lib/docusign/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSent?: (envelope: Record<string, unknown>) => void;
  sourceModule: SignatureSourceModule;
  sourceRecordId: string;
  sourceDocumentId?: string | null;
  documentName: string;
  documentBase64?: string;
  documentFile?: File | null;
  defaultRecipientName?: string;
  defaultRecipientEmail?: string;
  emailSubject?: string;
};

type Connection = {
  id: number;
  provider?: { provider_key?: string; name?: string };
  provider_key?: string;
  provider_name?: string;
  account_display_name?: string | null;
  status?: string;
  health_status?: string;
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(new Error("The selected document could not be read."));
    reader.readAsDataURL(file);
  });
}

export default function SendForSignatureModal({
  open,
  onClose,
  onSent,
  sourceModule,
  sourceRecordId,
  sourceDocumentId = null,
  documentName,
  documentBase64,
  documentFile,
  defaultRecipientName = "",
  defaultRecipientEmail = "",
  emailSubject,
}: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [recipients, setRecipients] = useState<SignatureRecipient[]>([
    { name: defaultRecipientName, email: defaultRecipientEmail, routingOrder: 1 },
  ]);
  const [subject, setSubject] = useState(emailSubject || `Please sign: ${documentName}`);
  const [message, setMessage] = useState("Please review and sign the attached document.");
  const [sendImmediately, setSendImmediately] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const valid = useMemo(
    () =>
      Boolean(
        connectionId &&
          subject.trim() &&
          recipients.length &&
          recipients.every(
            (recipient) =>
              recipient.name.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email.trim()),
          ) &&
          (documentBase64 || documentFile),
      ),
    [connectionId, documentBase64, documentFile, recipients, subject],
  );

  useEffect(() => {
    if (!open) return;
    setRecipients([{ name: defaultRecipientName, email: defaultRecipientEmail, routingOrder: 1 }]);
    setSubject(emailSubject || `Please sign: ${documentName}`);
    setError("");
    void loadConnections();
  }, [defaultRecipientEmail, defaultRecipientName, documentName, emailSubject, open]);

  async function loadConnections() {
    setLoadingConnections(true);
    try {
      const response = await fetch("/api/foundations/connections", {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Connected signature providers could not be loaded.");
      }
     const providers = Array.isArray(payload.providers) ? payload.providers : [];
const all = Array.isArray(payload.connections) ? payload.connections : [];

const available = all
  .map((connection: any) => {
    const provider = providers.find(
      (p: any) => Number(p.id) === Number(connection.provider_id),
    );

    return {
      ...connection,
      provider,
      provider_key: provider?.provider_key,
      provider_name: provider?.name,
    };
  })
  .filter((connection: any) => {
    return (
      connection.provider_key === "docusign" &&
      connection.status === "Connected" &&
      connection.health_status === "Healthy"
    );
  });
      setConnections(available);
      setConnectionId(available[0] ? String(available[0].id) : "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Signature providers could not be loaded.");
    } finally {
      setLoadingConnections(false);
    }
  }

  function updateRecipient(index: number, field: "name" | "email", value: string) {
    setRecipients((current) =>
      current.map((recipient, recipientIndex) =>
        recipientIndex === index ? { ...recipient, [field]: value } : recipient,
      ),
    );
  }

  function addRecipient() {
    setRecipients((current) => [
      ...current,
      { name: "", email: "", routingOrder: current.length + 1 },
    ]);
  }

  function removeRecipient(index: number) {
    setRecipients((current) =>
      current
        .filter((_, recipientIndex) => recipientIndex !== index)
        .map((recipient, recipientIndex) => ({
          ...recipient,
          routingOrder: recipientIndex + 1,
        })),
    );
  }

  async function sendEnvelope() {
    if (!valid || sending) return;
    setSending(true);
    setError("");

    try {
      const base64 = documentBase64 || (documentFile ? await fileToBase64(documentFile) : "");
     const response = await fetch(
  "/api/foundations/connections/docusign/envelopes",
  {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: Number(connectionId),
          sourceModule,
          sourceRecordId,
          sourceDocumentId,
          documentName,
          documentExtension:
            documentName.split(".").pop() ||
            documentFile?.name.split(".").pop() ||
            "pdf",
          documentBase64: base64,
          emailSubject: subject.trim(),
          emailMessage: message.trim(),
          recipients: recipients.map((recipient, index) => ({
            name: recipient.name.trim(),
            email: recipient.email.trim(),
            routingOrder: index + 1,
          })),
          sendImmediately,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "The document could not be sent for signature.");
      }
      onSent?.(payload.envelope || {});
      onClose();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The document could not be sent for signature.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div style={backdrop} role="dialog" aria-modal="true">
      <div style={modal}>
        <div style={header}>
          <div>
            <div style={eyebrow}>Electronic signature</div>
            <h2 style={title}>Send for Signature</h2>
            <p style={description}>
              Send {documentName} through the organisation&apos;s connected signature provider.
            </p>
          </div>
          <button type="button" onClick={onClose} style={iconButton} disabled={sending} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <div style={content}>
          {error ? <div style={errorBox}>{error}</div> : null}

          <label style={field}>
            <span style={label}>Signature provider</span>
            <select
              value={connectionId}
              onChange={(event) => setConnectionId(event.target.value)}
              style={input}
              disabled={loadingConnections || sending}
            >
              <option value="">
                {loadingConnections ? "Loading providers..." : "Select provider"}
              </option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.provider?.name || connection.provider_name || "DocuSign"}
                  {connection.account_display_name ? ` · ${connection.account_display_name}` : ""}
                </option>
              ))}
            </select>
          </label>

          {!loadingConnections && connections.length === 0 ? (
            <div style={notice}>
              Connect and test DocuSign in Foundations → Connections before sending a document.
            </div>
          ) : null}

          <div style={sectionHeading}>
            <div>
              <strong>Recipients</strong>
              <small style={supporting}>Recipients sign in the order shown.</small>
            </div>
            <button type="button" onClick={addRecipient} style={secondaryButton} disabled={sending}>
              <Plus size={15} /> Add recipient
            </button>
          </div>

          <div style={recipientList}>
            {recipients.map((recipient, index) => (
              <div key={index} style={recipientRow}>
                <div style={order}>{index + 1}</div>
                <input
                  value={recipient.name}
                  onChange={(event) => updateRecipient(index, "name", event.target.value)}
                  placeholder="Recipient name"
                  style={input}
                  disabled={sending}
                />
                <input
                  type="email"
                  value={recipient.email}
                  onChange={(event) => updateRecipient(index, "email", event.target.value)}
                  placeholder="recipient@example.com"
                  style={input}
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  style={iconButton}
                  disabled={recipients.length === 1 || sending}
                  aria-label="Remove recipient"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <label style={field}>
            <span style={label}>Email subject</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} style={input} disabled={sending} />
          </label>

          <label style={field}>
            <span style={label}>Message</span>
            <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} style={textarea} disabled={sending} />
          </label>

          <label style={toggle}>
            <input type="checkbox" checked={sendImmediately} onChange={(event) => setSendImmediately(event.target.checked)} disabled={sending} />
            <span>
              <strong>Send immediately</strong>
              <small style={supporting}>Untick to create a draft envelope in DocuSign.</small>
            </span>
          </label>
        </div>

        <div style={footer}>
          <button type="button" onClick={onClose} style={secondaryButton} disabled={sending}>Cancel</button>
          <button type="button" onClick={() => void sendEnvelope()} style={valid ? primaryButton : disabledButton} disabled={!valid || sending}>
            {sending ? <Loader2 size={16} /> : sendImmediately ? <Send size={16} /> : <FileSignature size={16} />}
            {sending ? "Sending..." : sendImmediately ? "Send for Signature" : "Create Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdrop: CSSProperties = { position: "fixed", inset: 0, zIndex: 1200, display: "grid", placeItems: "center", padding: 20, background: "rgba(35,27,40,.48)" };
const modal: CSSProperties = { width: "min(760px,calc(100vw - 40px))", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "#fff", border: "1px solid #E1D8E5", borderRadius: 20, boxShadow: "0 24px 80px rgba(43,34,49,.24)" };
const header: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, padding: 22, borderBottom: "1px solid #E7E1EA" };
const content: CSSProperties = { display: "grid", gap: 16, padding: 22 };
const footer: CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 9, padding: 18, borderTop: "1px solid #E7E1EA", background: "#FBF9FC" };
const eyebrow: CSSProperties = { color: "#6E5084", fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" };
const title: CSSProperties = { margin: "5px 0 6px", color: "#302638", fontSize: 24 };
const description: CSSProperties = { margin: 0, color: "#746C78", fontSize: 13, lineHeight: 1.55 };
const field: CSSProperties = { display: "grid", gap: 7 };
const label: CSSProperties = { color: "#514758", fontSize: 12, fontWeight: 800 };
const input: CSSProperties = { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCD3E0", borderRadius: 10, padding: "10px 11px", background: "#fff", color: "#302638", font: "inherit" };
const textarea: CSSProperties = { ...input, resize: "vertical" };
const sectionHeading: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const recipientList: CSSProperties = { display: "grid", gap: 9 };
const recipientRow: CSSProperties = { display: "grid", gridTemplateColumns: "32px minmax(0,1fr) minmax(0,1fr) 40px", gap: 8, alignItems: "center" };
const order: CSSProperties = { display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 999, background: "#F7F1FC", color: "#6E5084", fontSize: 12, fontWeight: 900 };
const toggle: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, padding: 13, border: "1px solid #E7E1EA", borderRadius: 12, background: "#FBF9FC" };
const supporting: CSSProperties = { display: "block", color: "#746C78", fontSize: 11, lineHeight: 1.45, marginTop: 3 };
const notice: CSSProperties = { padding: 12, borderRadius: 10, background: "#FFF8E7", border: "1px solid #EAD8A5", color: "#7C5A18", fontSize: 12 };
const errorBox: CSSProperties = { padding: 12, borderRadius: 10, background: "#FBF2F4", border: "1px solid #E7CBD1", color: "#81505B", fontSize: 12 };
const primaryButton: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: 0, borderRadius: 10, padding: "10px 14px", background: "#6E5084", color: "#fff", fontWeight: 800, cursor: "pointer" };
const disabledButton: CSSProperties = { ...primaryButton, opacity: .55, cursor: "not-allowed" };
const secondaryButton: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: "1px solid #D8CCDE", borderRadius: 10, padding: "9px 12px", background: "#fff", color: "#5B4568", fontWeight: 800, cursor: "pointer" };
const iconButton: CSSProperties = { display: "grid", placeItems: "center", width: 38, height: 38, border: "1px solid #D8CCDE", borderRadius: 10, background: "#fff", color: "#5B4568", cursor: "pointer" };