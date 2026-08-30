"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import mobileStyles from "../MyEmployment.module.css";

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

const emptyContact: ContactForm = {
  fullName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
};

function toForm(record: EmergencyContactRecord | undefined): ContactForm {
  return {
    fullName: record?.full_name || "",
    relationship: record?.relationship || "",
    phone: record?.phone || "",
    email: record?.email || "",
    address: record?.address || "",
  };
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not recorded";
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
    setError("");

    try {
      const response = await fetch("/api/my-employment/emergency-contacts", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            employeeLinked?: boolean;
            contacts?: EmergencyContactRecord[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "Your emergency contacts could not be loaded.",
        );
      }

      const nextContacts = Array.isArray(payload.contacts)
        ? payload.contacts
        : [];

      setEmployeeLinked(payload.employeeLinked !== false);
      setContacts(nextContacts);
      setContactOne(
        toForm(
          nextContacts.find(
            (contact) => contact.contact_number === 1,
          ),
        ),
      );
      setContactTwo(
        toForm(
          nextContacts.find(
            (contact) => contact.contact_number === 2,
          ),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your emergency contacts could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, []);

  const primaryContact =
    contacts.find((contact) => contact.contact_number === 1) ??
    contacts[0] ??
    undefined;

  const desktopContactFields = useMemo(
    () => [
      ["Primary emergency contact", displayValue(primaryContact?.full_name)],
      ["Relationship", displayValue(primaryContact?.relationship)],
      ["Primary telephone", displayValue(primaryContact?.phone)],
      ["Secondary telephone", "Not recorded"],
      ["Email address", displayValue(primaryContact?.email)],
      ["Preferred contact method", "Not recorded"],
    ],
    [primaryContact],
  );

  const confirmationLabel = loading
    ? "Loading"
    : error
      ? "Unavailable"
      : !employeeLinked
        ? "Not linked"
        : primaryContact
          ? "Recorded"
          : "Not confirmed";

  const displayContacts = useMemo(
    () => [
      {
        title: "Primary contact",
        record: contacts.find(
          (contact) => contact.contact_number === 1,
        ),
      },
      {
        title: "Second contact",
        record: contacts.find(
          (contact) => contact.contact_number === 2,
        ),
      },
    ],
    [contacts],
  );

  async function saveContacts() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/my-employment/emergency-contacts",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            contacts: [
              {
                contactNumber: 1,
                fullName: contactOne.fullName,
                relationship: contactOne.relationship,
                phone: contactOne.phone,
                email: contactOne.email,
                address: contactOne.address,
              },
              {
                contactNumber: 2,
                fullName: contactTwo.fullName,
                relationship: contactTwo.relationship,
                phone: contactTwo.phone,
                email: contactTwo.email,
                address: contactTwo.address,
              },
            ],
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            contacts?: EmergencyContactRecord[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "Your emergency contacts could not be saved.",
        );
      }

      const nextContacts = Array.isArray(payload.contacts)
        ? payload.contacts
        : [];

      setContacts(nextContacts);
      setContactOne(
        toForm(
          nextContacts.find(
            (contact) => contact.contact_number === 1,
          ),
        ),
      );
      setContactTwo(
        toForm(
          nextContacts.find(
            (contact) => contact.contact_number === 2,
          ),
        ),
      );
      setEditing(false);
      setMessage("Emergency contacts updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your emergency contacts could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* PHONE-ONLY employee app */}
      <main
        className={`${mobileStyles.employeeMobileOnly} ${mobileStyles.employeeMobilePage} ${mobileStyles.mobileSectionStack}`}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <header>
          <h1 style={{ margin: 0, color: "#6E5084", fontSize: 32 }}>
            Emergency Contacts
          </h1>
        </header>

        {loading ? (
          <section className={mobileStyles.mobileCompactCard} style={cardStyle}>
            Loading your emergency contacts...
          </section>
        ) : error && contacts.length === 0 ? (
          <section className={mobileStyles.mobileCompactCard} style={cardStyle}>
            <span style={{ color: "#8F3B3B" }}>{error}</span>
          </section>
        ) : !employeeLinked ? (
          <section className={mobileStyles.mobileCompactCard} style={cardStyle}>
            Your employee record is not available.
          </section>
        ) : editing ? (
          <>
            <ContactFormCard
              title="Primary contact"
              value={contactOne}
              onChange={setContactOne}
            />

            <ContactFormCard
              title="Second contact"
              value={contactTwo}
              onChange={setContactTwo}
            />

            {message ? <div style={messageStyle}>{message}</div> : null}
            {error ? <div style={errorStyle}>{error}</div> : null}

            <div className={mobileStyles.mobileActionRow}>
              <button
                type="button"
                className={mobileStyles.mobilePrimaryButton}
                onClick={() => void saveContacts()}
                disabled={saving}
                style={buttonStyle}
              >
                {saving ? "Saving..." : "Save contacts"}
              </button>

              <button
                type="button"
                className={mobileStyles.mobileSecondaryButton}
                onClick={() => {
                  setEditing(false);
                  setMessage("");
                  setError("");
                  setContactOne(
                    toForm(
                      contacts.find(
                        (contact) => contact.contact_number === 1,
                      ),
                    ),
                  );
                  setContactTwo(
                    toForm(
                      contacts.find(
                        (contact) => contact.contact_number === 2,
                      ),
                    ),
                  );
                }}
                disabled={saving}
                style={buttonStyle}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {displayContacts.map(({ title, record }) => (
              <section
                key={title}
                className={mobileStyles.mobileCompactCard}
                style={cardStyle}
              >
                <h2 style={sectionHeadingStyle}>{title}</h2>
                <MobileRecordRow label="Name" value={record?.full_name} />
                <MobileRecordRow
                  label="Relationship"
                  value={record?.relationship}
                />
                <MobileRecordRow label="Phone" value={record?.phone} />
                <MobileRecordRow label="Email" value={record?.email} />
                <MobileRecordRow label="Address" value={record?.address} />
              </section>
            ))}

            {message ? <div style={messageStyle}>{message}</div> : null}
            {error ? <div style={errorStyle}>{error}</div> : null}

            <button
              type="button"
              className={mobileStyles.mobilePrimaryButton}
              onClick={() => setEditing(true)}
              style={{ ...buttonStyle, width: "fit-content" }}
            >
              Update contacts
            </button>
          </>
        )}
      </main>

      {/* EXISTING EMPLOYEE DESKTOP PRESENTATION — intentionally preserved */}
      <main
        className={mobileStyles.employeeDesktopOnly}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                color: "#6E5084",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Employee workspace
            </p>

            <h1
              style={{
                margin: 0,
                color: "#6E5084",
                fontSize: 32,
                lineHeight: 1.2,
              }}
            >
              Emergency Contacts
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748B",
                fontSize: 15,
                lineHeight: 1.55,
              }}
            >
              Review the emergency-contact information held by your organisation.
            </p>
          </div>

          <Link
            href="/dashboard/my-employment"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 42,
              padding: "9px 15px",
              borderRadius: 11,
              border: "1px solid #CDB2E2",
              background: "#FFFFFF",
              color: "#6E5084",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ← Back to My Employment
          </Link>
        </header>

        <section
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 16,
            border: "1px solid #E4D3EE",
            background: "#F7F1FC",
          }}
        >
          <strong style={{ color: "#6E5084", fontSize: 15 }}>
            Restricted personal information
          </strong>

          <p
            style={{
              margin: "7px 0 0",
              color: "#526071",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            Emergency-contact details are used only where necessary during an
            urgent situation. Access and changes should be recorded securely.
          </p>
        </section>

        <section
          style={{
            overflow: "hidden",
            borderRadius: 18,
            border: "1px solid #E8E2EB",
            background: "#FFFFFF",
            boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              padding: 22,
              borderBottom: "1px solid #EEEAF1",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#2F2635", fontSize: 18 }}>
                Contact details
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748B",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Your nominated contact and the details currently held.
              </p>
            </div>

            <span
              style={{
                flexShrink: 0,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #D8DCE2",
                background: "#F8FAFC",
                color: "#64748B",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {confirmationLabel}
            </span>
          </div>

          <div style={{ padding: "8px 22px 22px" }}>
            {loading ? (
              <div style={{ padding: "24px 0", color: "#64748B", fontSize: 13 }}>
                Leo HR is loading your emergency-contact information.
              </div>
            ) : error ? (
              <div
                style={{
                  padding: "24px 0",
                  color: "#8F3B3B",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {error}
              </div>
            ) : !employeeLinked ? (
              <div
                style={{
                  padding: "24px 0",
                  color: "#64748B",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                Your account has not yet been linked to an employee record.
              </div>
            ) : (
              desktopContactFields.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(190px, 0.8fr) minmax(0, 1.2fr)",
                    gap: 20,
                    padding: "15px 0",
                    borderBottom: "1px solid #F0EDF2",
                  }}
                >
                  <div
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      color:
                        value === "Not recorded" ? "#94A3B8" : "#2F2635",
                      fontSize: 13,
                      fontWeight: 650,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          style={{
            marginTop: 20,
            padding: 22,
            borderRadius: 18,
            border: "1px solid #E8E2EB",
            background: "#FFFFFF",
            boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
          }}
        >
          <h2 style={{ margin: 0, color: "#2F2635", fontSize: 17 }}>
            Confirmation
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748B",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            Once employee self-service changes are enabled, you will be able to
            add, update and confirm your emergency contacts here. Changes will
            follow the same secure employee record and audit process already
            used by the main Employees workspace.
          </p>

          <button
            type="button"
            disabled
            style={{
              marginTop: 16,
              minHeight: 42,
              padding: "9px 15px",
              borderRadius: 11,
              border: "1px solid #D8DCE2",
              background: "#F8FAFC",
              color: "#94A3B8",
              fontSize: 14,
              fontWeight: 700,
              cursor: "not-allowed",
            }}
          >
            Update emergency contacts
          </button>
        </section>
      </main>
    </>
  );
}

function ContactFormCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ContactForm;
  onChange: (value: ContactForm) => void;
}) {
  const field = (key: keyof ContactForm, next: string) =>
    onChange({ ...value, [key]: next });

  return (
    <section className={mobileStyles.mobileCompactCard} style={cardStyle}>
      <h2 style={sectionHeadingStyle}>{title}</h2>

      <div
        className={mobileStyles.mobileFormGrid}
        style={{ display: "grid", gap: 12 }}
      >
        <FormField label="Full name">
          <input
            value={value.fullName}
            onChange={(event) => field("fullName", event.target.value)}
          />
        </FormField>

        <FormField label="Relationship">
          <input
            value={value.relationship}
            onChange={(event) => field("relationship", event.target.value)}
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            value={value.phone}
            onChange={(event) => field("phone", event.target.value)}
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={value.email}
            onChange={(event) => field("email", event.target.value)}
          />
        </FormField>

        <FormField label="Address">
          <textarea
            value={value.address}
            onChange={(event) => field("address", event.target.value)}
          />
        </FormField>
      </div>
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={mobileStyles.mobileFormField}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function MobileRecordRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div
      className={mobileStyles.mobileRecordRow}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "12px 0",
        borderBottom: "1px solid #F0EDF2",
      }}
    >
      <span
        className={mobileStyles.mobileRecordLabel}
        style={{ color: "#64748B", fontWeight: 700 }}
      >
        {label}
      </span>

      <span
        className={mobileStyles.mobileRecordValue}
        style={{
          color: value ? "#2F2635" : "#94A3B8",
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        {value || "Not recorded"}
      </span>
    </div>
  );
}

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 22px rgba(17,24,39,.05)",
} as const;

const sectionHeadingStyle = {
  margin: "0 0 10px",
  color: "#6E5084",
  fontSize: 18,
} as const;

const buttonStyle = {
  padding: "10px 15px",
} as const;

const messageStyle = {
  color: "#356653",
  fontSize: 13,
} as const;

const errorStyle = {
  color: "#8F3B3B",
  fontSize: 13,
} as const;
