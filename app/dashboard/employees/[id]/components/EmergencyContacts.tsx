"use client";

import { useCallback, useEffect, useState } from "react";

import Field from "./Field";
import ProfileSection from "./ProfileSection";
import SaveButton from "./SaveButton";

type EmergencyContactsProps = {
  employeeId: number;
};

type ContactForm = {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
};

type EmergencyContactRecord = {
  id: number;
  employee_id: number;
  contact_number: number;
  full_name: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EmergencyContactsResponse = {
  success?: boolean;
  contacts?: EmergencyContactRecord[];
  error?: string;
};

const emptyContact: ContactForm = {
  fullName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
};

function recordToForm(
  record: EmergencyContactRecord | undefined,
): ContactForm {
  return {
    fullName: record?.full_name || "",
    relationship: record?.relationship || "",
    phone: record?.phone || "",
    email: record?.email || "",
    address: record?.address || "",
  };
}

export default function EmergencyContacts({
  employeeId,
}: EmergencyContactsProps) {
  const [contactOne, setContactOne] =
    useState<ContactForm>(emptyContact);
  const [contactTwo, setContactTwo] =
    useState<ContactForm>(emptyContact);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/emergency-contacts`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = (await response.json().catch(() => null)) as
        | EmergencyContactsResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Emergency contacts could not be loaded.",
        );
      }

      const contacts = Array.isArray(result.contacts)
        ? result.contacts
        : [];

      setContactOne(
        recordToForm(
          contacts.find(
            (contact) => contact.contact_number === 1,
          ),
        ),
      );

      setContactTwo(
        recordToForm(
          contacts.find(
            (contact) => contact.contact_number === 2,
          ),
        ),
      );
    } catch (error) {
      console.error("Error loading emergency contacts:", error);

      setContactOne(emptyContact);
      setContactTwo(emptyContact);
      setMessage(
        error instanceof Error
          ? error.message
          : "Emergency contacts could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function updateContactOne(
    field: keyof ContactForm,
    value: string,
  ) {
    setContactOne((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateContactTwo(
    field: keyof ContactForm,
    value: string,
  ) {
    setContactTwo((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveContacts() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/emergency-contacts`,
        {
          method: "PUT",
          credentials: "include",
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

      const result = (await response.json().catch(() => null)) as
        | EmergencyContactsResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Emergency contacts could not be saved.",
        );
      }

      const contacts = Array.isArray(result.contacts)
        ? result.contacts
        : [];

      setContactOne(
        recordToForm(
          contacts.find(
            (contact) => contact.contact_number === 1,
          ),
        ),
      );

      setContactTwo(
        recordToForm(
          contacts.find(
            (contact) => contact.contact_number === 2,
          ),
        ),
      );

      setMessage("Emergency contacts saved.");
    } catch (error) {
      console.error("Error saving emergency contacts:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Emergency contacts could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileSection title="Emergency Contacts">
      <p
        style={{
          color: "#6B7280",
          fontSize: "14px",
          marginTop: 0,
        }}
      >
        Store up to two emergency contacts for genuine emergencies and welfare
        events.
      </p>

      <div style={cardsStyle}>
        <ContactCard
          title="Contact 1"
          contact={contactOne}
          onChange={updateContactOne}
        />

        <ContactCard
          title="Contact 2"
          contact={contactTwo}
          onChange={updateContactTwo}
        />
      </div>

      <SaveButton
        onClick={saveContacts}
        disabled={saving || loading}
      >
        {loading
          ? "Loading..."
          : saving
            ? "Saving..."
            : "Save emergency contacts"}
      </SaveButton>

      {message ? (
        <div
          style={{
            marginTop: "10px",
            color: "#6B7280",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      ) : null}
    </ProfileSection>
  );
}

function ContactCard({
  title,
  contact,
  onChange,
}: {
  title: string;
  contact: ContactForm;
  onChange: (
    field: keyof ContactForm,
    value: string,
  ) => void;
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          fontWeight: 800,
          marginBottom: "12px",
        }}
      >
        {title}
      </div>

      <Field
        label="Full Name"
        value={contact.fullName}
        onChange={(value) =>
          onChange("fullName", value)
        }
        placeholder="Contact full name"
      />

      <Field
        label="Relationship"
        value={contact.relationship}
        onChange={(value) =>
          onChange("relationship", value)
        }
        placeholder="Partner, parent, friend..."
      />

      <Field
        label="Phone"
        value={contact.phone}
        onChange={(value) =>
          onChange("phone", value)
        }
        placeholder="Phone number"
      />

      <Field
        label="Email"
        value={contact.email}
        onChange={(value) =>
          onChange("email", value)
        }
        placeholder="Optional"
      />

      <Field
        label="Address"
        value={contact.address}
        onChange={(value) =>
          onChange("address", value)
        }
        placeholder="Optional"
      />
    </div>
  );
}

const cardsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  background: "#F9FAFB",
};