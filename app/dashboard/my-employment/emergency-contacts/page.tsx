"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EmergencyContactRecord = {
  id?: number;
  contact_number?: number;
  full_name?: string | null;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type ContactForm = {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
};

const emptyContact: ContactForm = { fullName: "", relationship: "", phone: "", email: "", address: "" };

function toForm(record: EmergencyContactRecord | undefined): ContactForm {
  return {
    fullName: record?.full_name || "",
    relationship: record?.relationship || "",
    phone: record?.phone || "",
    email: record?.email || "",
    address: record?.address || "",
  };
}

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContactRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [contactOne, setContactOne] = useState<ContactForm>(emptyContact);
  const [contactTwo, setContactTwo] = useState<ContactForm>(emptyContact);

  async function loadContacts() {
    setLoading(true);
    try {
      const response = await fetch("/api/my-employment/emergency-contacts", { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; employeeLinked?: boolean; contacts?: EmergencyContactRecord[]; error?: string } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Your emergency contacts could not be loaded.");
      const next = Array.isArray(payload.contacts) ? payload.contacts : [];
      setEmployeeLinked(payload.employeeLinked !== false);
      setContacts(next);
      setContactOne(toForm(next.find((item) => item.contact_number === 1)));
      setContactTwo(toForm(next.find((item) => item.contact_number === 2)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your emergency contacts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, []);

  async function saveContacts() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/my-employment/emergency-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          contacts: [
            { contactNumber: 1, fullName: contactOne.fullName, relationship: contactOne.relationship, phone: contactOne.phone, email: contactOne.email, address: contactOne.address },
            { contactNumber: 2, fullName: contactTwo.fullName, relationship: contactTwo.relationship, phone: contactTwo.phone, email: contactTwo.email, address: contactTwo.address },
          ],
        }),
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; contacts?: EmergencyContactRecord[]; error?: string } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Your emergency contacts could not be saved.");
      const next = Array.isArray(payload.contacts) ? payload.contacts : [];
      setContacts(next);
      setContactOne(toForm(next.find((item) => item.contact_number === 1)));
      setContactTwo(toForm(next.find((item) => item.contact_number === 2)));
      setEditing(false);
      setMessage("Emergency contacts updated. Your organisation has an audited record of the change.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your emergency contacts could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setEditing(false);
    setMessage("");
    setError("");
    setContactOne(toForm(contacts.find((item) => item.contact_number === 1)));
    setContactTwo(toForm(contacts.find((item) => item.contact_number === 2)));
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrow}>Employee workspace</p>
          <h1 style={titleStyle}>Emergency Contacts</h1>
          <p style={introStyle}>Review and maintain the emergency contact details held for you.</p>
        </div>
        <Link href="/dashboard/my-employment" style={backLink}>← Back to My Employment</Link>
      </header>

      <section style={noticeCard}>
        <strong style={{ color: "#6E5084" }}>Restricted personal information</strong>
        <p style={{ margin: "7px 0 0", color: "#526071", lineHeight: 1.6 }}>Emergency-contact details are used only where necessary. Changes you make are recorded in Leo HR's audit trail.</p>
      </section>

      {error ? <div style={errorCard}>{error}</div> : null}
      {message ? <div style={successCard}>{message}</div> : null}

      {loading ? (
        <section style={card}>Loading your emergency contacts...</section>
      ) : !employeeLinked ? (
        <section style={card}>Your account has not yet been linked to an employee record.</section>
      ) : editing ? (
        <div style={{ display: "grid", gap: 18 }}>
          <ContactEditor title="Primary contact" value={contactOne} onChange={setContactOne} />
          <ContactEditor title="Second contact" value={contactTwo} onChange={setContactTwo} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void saveContacts()} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save contacts"}</button>
            <button type="button" onClick={cancelEditing} disabled={saving} style={secondaryButton}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={responsiveGrid}>
            <ContactCard title="Primary contact" record={contacts.find((item) => item.contact_number === 1)} />
            <ContactCard title="Second contact" record={contacts.find((item) => item.contact_number === 2)} />
          </div>
          <button type="button" onClick={() => setEditing(true)} style={{ ...primaryButton, width: "fit-content" }}>Update contacts</button>
        </div>
      )}
    </main>
  );
}

function ContactCard({ title, record }: { title: string; record?: EmergencyContactRecord }) {
  return (
    <section style={card}>
      <h2 style={heading}>{title}</h2>
      <InfoRow label="Name" value={record?.full_name || "Not recorded"} />
      <InfoRow label="Relationship" value={record?.relationship || "Not recorded"} />
      <InfoRow label="Phone" value={record?.phone || "Not recorded"} />
      <InfoRow label="Email" value={record?.email || "Not recorded"} />
      <InfoRow label="Address" value={record?.address || "Not recorded"} />
    </section>
  );
}

function ContactEditor({ title, value, onChange }: { title: string; value: ContactForm; onChange: (next: ContactForm) => void }) {
  return (
    <section style={card}>
      <h2 style={heading}>{title}</h2>
      <div style={formGrid}>
        <Field label="Full name" value={value.fullName} onChange={(fullName) => onChange({ ...value, fullName })} />
        <Field label="Relationship" value={value.relationship} onChange={(relationship) => onChange({ ...value, relationship })} />
        <Field label="Phone" value={value.phone} onChange={(phone) => onChange({ ...value, phone })} />
        <Field label="Email" type="email" value={value.email} onChange={(email) => onChange({ ...value, email })} />
        <Field label="Address" value={value.address} onChange={(address) => onChange({ ...value, address })} wide />
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return <label style={{ display: "grid", gap: 7, gridColumn: wide ? "1 / -1" : undefined }}><span style={labelStyle}>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /></label>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div style={infoRow}><span style={labelStyle}>{label}</span><span style={{ color: value === "Not recorded" ? "#94A3B8" : "#2F2635", fontWeight: 600, textAlign: "right", overflowWrap: "anywhere" }}>{value}</span></div>;
}

const pageStyle = { maxWidth: 1200, margin: "0 auto", paddingBottom: 32 } as const;
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" as const, marginBottom: 22 };
const eyebrow = { margin: "0 0 7px", color: "#6E5084", fontWeight: 800, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const titleStyle = { margin: 0, color: "#6E5084", fontSize: 32 } as const;
const introStyle = { color: "#64748B", lineHeight: 1.6 } as const;
const noticeCard = { background: "#F7F1FC", border: "1px solid #E4D3EE", borderRadius: 16, padding: 20, marginBottom: 20 } as const;
const card = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 18, padding: 22, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const heading = { margin: "0 0 14px", color: "#2F2635", fontSize: 18 } as const;
const responsiveGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 } as const;
const infoRow = { display: "flex", justifyContent: "space-between", gap: 20, padding: "12px 0", borderBottom: "1px solid #F0EDF2" } as const;
const labelStyle = { color: "#64748B", fontWeight: 700 } as const;
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 } as const;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, minHeight: 44, border: "1px solid #D9CEE7", borderRadius: 10, padding: "10px 12px", font: "inherit", color: "#2F2635" } as const;
const primaryButton = { border: 0, borderRadius: 10, background: "#6E5084", color: "#fff", padding: "11px 16px", fontWeight: 800, cursor: "pointer" } as const;
const secondaryButton = { border: "1px solid #CDB2E2", borderRadius: 10, background: "#fff", color: "#6E5084", padding: "10px 16px", fontWeight: 700, cursor: "pointer" } as const;
const backLink = { display: "inline-block", textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
const errorCard = { ...card, color: "#8F3B3B", marginBottom: 16 } as const;
const successCard = { ...card, color: "#356653", marginBottom: 16, background: "#F5FFF9" } as const;
