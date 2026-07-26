"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EmergencyContact = Record<string, unknown>;

type EmergencyContactsResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  contacts?: EmergencyContact[];
  error?: string;
};

function textValue(
  record: EmergencyContact | null,
  keys: string[],
) {
  if (!record) return "Not recorded";

  for (const key of keys) {
    const value = record[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "Not recorded";
}

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEmergencyContacts() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          "/api/my-employment/emergency-contacts",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const result =
          (await response.json()) as EmergencyContactsResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              "Your emergency-contact information could not be loaded.",
          );
        }

        if (!active) return;

        setEmployeeLinked(result.employeeLinked !== false);
        setContacts(
          Array.isArray(result.contacts) ? result.contacts : [],
        );
        setLoading(false);
      } catch (error) {
        console.error(
          "LEO emergency contacts page load failed:",
          error,
        );

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your emergency-contact information could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadEmergencyContacts();

    return () => {
      active = false;
    };
  }, []);

  const primaryContact = contacts[0] ?? null;

  const contactFields = useMemo(
    () => [
      [
        "Primary emergency contact",
        textValue(primaryContact, [
          "contact_name",
          "full_name",
          "name",
          "emergency_contact_name",
          "primary_contact_name",
        ]),
      ],
      [
        "Relationship",
        textValue(primaryContact, [
          "relationship",
          "relationship_to_employee",
          "contact_relationship",
        ]),
      ],
      [
        "Primary telephone",
        textValue(primaryContact, [
          "primary_telephone",
          "primary_phone",
          "telephone",
          "phone",
          "phone_number",
          "mobile_number",
        ]),
      ],
      [
        "Secondary telephone",
        textValue(primaryContact, [
          "secondary_telephone",
          "secondary_phone",
          "alternative_phone",
          "alternate_phone",
        ]),
      ],
      [
        "Email address",
        textValue(primaryContact, [
          "email_address",
          "email",
          "contact_email",
        ]),
      ],
      [
        "Preferred contact method",
        textValue(primaryContact, [
          "preferred_contact_method",
          "contact_method",
          "preferred_method",
        ]),
      ],
    ],
    [primaryContact],
  );

  const hasRecordedDetails = contactFields.some(
    ([, value]) => value !== "Not recorded",
  );

  const confirmationLabel = loading
    ? "Loading"
    : loadError
      ? "Unavailable"
      : !employeeLinked
        ? "Not linked"
        : hasRecordedDetails
          ? "Recorded"
          : "Not confirmed";

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            <h2
              style={{
                margin: 0,
                color: "#2F2635",
                fontSize: 18,
              }}
            >
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
            <div
              style={{
                padding: "24px 0",
                color: "#64748B",
                fontSize: 13,
              }}
            >
              LEO is loading your emergency-contact information.
            </div>
          ) : loadError ? (
            <div
              style={{
                padding: "24px 0",
                color: "#8F3B3B",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {loadError}
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
              Your account has not yet been linked to an employee record. An
              organisation owner or senior user needs to complete that link
              before your emergency-contact information can appear.
            </div>
          ) : (
            contactFields.map(([label, value]) => (
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
                      value === "Not recorded"
                        ? "#94A3B8"
                        : "#2F2635",
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
        <h2
          style={{
            margin: 0,
            color: "#2F2635",
            fontSize: 17,
          }}
        >
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
          follow the same secure employee record and audit process already used
          by the main Employees workspace.
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
  );
}