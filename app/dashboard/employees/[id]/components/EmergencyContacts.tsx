"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SaveButton from "./SaveButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const emptyContact: ContactForm = {
  fullName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
};

export default function EmergencyContacts({
  employeeId,
}: EmergencyContactsProps) {
  const [contactOne, setContactOne] = useState<ContactForm>(emptyContact);
  const [contactTwo, setContactTwo] = useState<ContactForm>(emptyContact);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadContacts() {
      const { data, error } = await supabase
        .from("employee_emergency_contacts")
        .select(
          "contact_number, full_name, relationship, phone, email, address"
        )
        .eq("employee_id", employeeId)
        .order("contact_number", { ascending: true });

      if (error) {
        console.error("Error loading emergency contacts:", error);
        return;
      }

      const first = data?.find((contact) => contact.contact_number === 1);
      const second = data?.find((contact) => contact.contact_number === 2);

      if (first) {
        setContactOne({
          fullName: first.full_name || "",
          relationship: first.relationship || "",
          phone: first.phone || "",
          email: first.email || "",
          address: first.address || "",
        });
      }

      if (second) {
        setContactTwo({
          fullName: second.full_name || "",
          relationship: second.relationship || "",
          phone: second.phone || "",
          email: second.email || "",
          address: second.address || "",
        });
      }
    }

    loadContacts();
  }, [employeeId]);

  function updateContactOne(field: keyof ContactForm, value: string) {
    setContactOne((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateContactTwo(field: keyof ContactForm, value: string) {
    setContactTwo((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveContacts() {
    setSaving(true);
    setMessage("");

    const rows = [
      {
        employee_id: employeeId,
        contact_number: 1,
        full_name: contactOne.fullName || null,
        relationship: contactOne.relationship || null,
        phone: contactOne.phone || null,
        email: contactOne.email || null,
        address: contactOne.address || null,
        updated_at: new Date().toISOString(),
      },
      {
        employee_id: employeeId,
        contact_number: 2,
        full_name: contactTwo.fullName || null,
        relationship: contactTwo.relationship || null,
        phone: contactTwo.phone || null,
        email: contactTwo.email || null,
        address: contactTwo.address || null,
        updated_at: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from("employee_emergency_contacts")
      .upsert(rows, { onConflict: "employee_id,contact_number" });

    if (error) {
      console.error("Error saving emergency contacts:", error);
      setMessage("Emergency contacts could not be saved.");
      setSaving(false);
      return;
    }

    setMessage("Emergency contacts saved.");
    setSaving(false);
  }

  return (
    <ProfileSection title="Emergency Contacts">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
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

      <SaveButton onClick={saveContacts} disabled={saving}>
        {saving ? "Saving..." : "Save emergency contacts"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}
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
  onChange: (field: keyof ContactForm, value: string) => void;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, marginBottom: "12px" }}>{title}</div>

      <Field
        label="Full Name"
        value={contact.fullName}
        onChange={(value) => onChange("fullName", value)}
        placeholder="Contact full name"
      />

      <Field
        label="Relationship"
        value={contact.relationship}
        onChange={(value) => onChange("relationship", value)}
        placeholder="Partner, parent, friend..."
      />

      <Field
        label="Phone"
        value={contact.phone}
        onChange={(value) => onChange("phone", value)}
        placeholder="Phone number"
      />

      <Field
        label="Email"
        value={contact.email}
        onChange={(value) => onChange("email", value)}
        placeholder="Optional"
      />

      <Field
        label="Address"
        value={contact.address}
        onChange={(value) => onChange("address", value)}
        placeholder="Optional"
      />
    </div>
  );
}

const cardsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  background: "#F9FAFB",
};