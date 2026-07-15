"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModuleId: number;
  certificateAvailable: boolean;
};

type CertificateSettings = {
  id: number;
  learning_module_id: number;
  certificate_title: string | null;
  certificate_description: string | null;
  validity_months: number | null;
  renewal_required: boolean;
  renewal_reminder_days: number | null;
  issue_automatically: boolean;
  manager_approval_required: boolean;
  signatory_name: string | null;
  signatory_role: string | null;
  certificate_reference_prefix: string | null;
  notes: string | null;
};

export default function LearningCertificates({
  learningModuleId,
  certificateAvailable,
}: Props) {
  const [settingsId, setSettingsId] =
    useState<number | null>(null);

  const [
    certificateTitle,
    setCertificateTitle,
  ] = useState("");

  const [
    certificateDescription,
    setCertificateDescription,
  ] = useState("");

  const [validityMonths, setValidityMonths] =
    useState("");

  const [
    renewalRequired,
    setRenewalRequired,
  ] = useState(false);

  const [
    renewalReminderDays,
    setRenewalReminderDays,
  ] = useState("30");

  const [
    issueAutomatically,
    setIssueAutomatically,
  ] = useState(true);

  const [
    managerApprovalRequired,
    setManagerApprovalRequired,
  ] = useState(false);

  const [signatoryName, setSignatoryName] =
    useState("");

  const [signatoryRole, setSignatoryRole] =
    useState("");

  const [
    certificateReferencePrefix,
    setCertificateReferencePrefix,
  ] = useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadCertificateSettings();
  }, [learningModuleId]);

  async function loadCertificateSettings() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from(
        "learning_certificate_settings"
      )
      .select(
        `
        id,
        learning_module_id,
        certificate_title,
        certificate_description,
        validity_months,
        renewal_required,
        renewal_reminder_days,
        issue_automatically,
        manager_approval_required,
        signatory_name,
        signatory_role,
        certificate_reference_prefix,
        notes
        `
      )
      .eq(
        "learning_module_id",
        learningModuleId
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading certificate settings:",
        error
      );

      setErrorMessage(
        "The certificate settings could not be loaded."
      );

      setLoading(false);
      return;
    }

    if (data) {
      const settings =
        data as CertificateSettings;

      setSettingsId(settings.id);

      setCertificateTitle(
        settings.certificate_title || ""
      );

      setCertificateDescription(
        settings.certificate_description || ""
      );

      setValidityMonths(
        settings.validity_months !== null
          ? String(
              settings.validity_months
            )
          : ""
      );

      setRenewalRequired(
        settings.renewal_required
      );

      setRenewalReminderDays(
        settings.renewal_reminder_days !==
          null
          ? String(
              settings.renewal_reminder_days
            )
          : "30"
      );

      setIssueAutomatically(
        settings.issue_automatically
      );

      setManagerApprovalRequired(
        settings.manager_approval_required
      );

      setSignatoryName(
        settings.signatory_name || ""
      );

      setSignatoryRole(
        settings.signatory_role || ""
      );

      setCertificateReferencePrefix(
        settings.certificate_reference_prefix ||
          ""
      );

      setNotes(settings.notes || "");
    }

    setLoading(false);
  }

  async function saveCertificateSettings() {
    if (
      validityMonths &&
      Number(validityMonths) < 1
    ) {
      setErrorMessage(
        "Certificate validity must be at least one month."
      );
      return;
    }

    if (
      renewalRequired &&
      (!renewalReminderDays ||
        Number(renewalReminderDays) < 1)
    ) {
      setErrorMessage(
        "Enter how many days before expiry the renewal reminder should appear."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const settingsData = {
      learning_module_id:
        learningModuleId,
      certificate_title:
        certificateTitle.trim() || null,
      certificate_description:
        certificateDescription.trim() ||
        null,
      validity_months:
        validityMonths
          ? Number(validityMonths)
          : null,
      renewal_required:
        renewalRequired,
      renewal_reminder_days:
        renewalRequired &&
        renewalReminderDays
          ? Number(renewalReminderDays)
          : null,
      issue_automatically:
        issueAutomatically,
      manager_approval_required:
        managerApprovalRequired,
      signatory_name:
        signatoryName.trim() || null,
      signatory_role:
        signatoryRole.trim() || null,
      certificate_reference_prefix:
        certificateReferencePrefix.trim() ||
        null,
      notes: notes.trim() || null,
    };

    const { data, error } = settingsId
      ? await supabase
          .from(
            "learning_certificate_settings"
          )
          .update(settingsData)
          .eq("id", settingsId)
          .select("id")
          .single()
      : await supabase
          .from(
            "learning_certificate_settings"
          )
          .insert(settingsData)
          .select("id")
          .single();

    if (error || !data) {
      console.error(
        "Error saving certificate settings:",
        error
      );

      setErrorMessage(
        "The certificate settings could not be saved."
      );

      setSaving(false);
      return;
    }

    setSettingsId(data.id);

    setMessage(
      "Certificate settings saved."
    );

    setSaving(false);
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            Certificates
          </h3>

          <p style={descriptionStyle}>
            Configure the certificate issued when
            this learning is completed.
          </p>
        </div>
      </div>

      {!certificateAvailable && (
        <div style={noticeStyle}>
          Certificates are not currently enabled
          for this learning resource. They can be
          enabled from the Overview workspace.
        </div>
      )}

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={loadingStyle}>
          Loading certificate settings...
        </div>
      ) : (
        <>
          <div style={settingsPanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h4 style={panelTitleStyle}>
                  Certificate Details
                </h4>

                <p
                  style={
                    panelDescriptionStyle
                  }
                >
                  Set the wording and reference
                  details that will appear on the
                  certificate.
                </p>
              </div>
            </div>

            <FormField label="Certificate title">
              <input
                type="text"
                value={certificateTitle}
                onChange={(event) =>
                  setCertificateTitle(
                    event.target.value
                  )
                }
                placeholder="For example, Fire Safety Awareness Certificate"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Certificate description">
              <textarea
                value={
                  certificateDescription
                }
                onChange={(event) =>
                  setCertificateDescription(
                    event.target.value
                  )
                }
                placeholder="Briefly describe what the employee has completed."
                style={textareaStyle}
              />
            </FormField>

            <div style={formGridStyle}>
              <FormField label="Certificate reference prefix">
                <input
                  type="text"
                  value={
                    certificateReferencePrefix
                  }
                  onChange={(event) =>
                    setCertificateReferencePrefix(
                      event.target.value
                    )
                  }
                  placeholder="For example, FIRE"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Validity in months">
                <input
                  type="number"
                  min="1"
                  value={validityMonths}
                  onChange={(event) =>
                    setValidityMonths(
                      event.target.value
                    )
                  }
                  placeholder="Leave blank if it does not expire"
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div style={settingsPanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h4 style={panelTitleStyle}>
                  Issue and Renewal
                </h4>

                <p
                  style={
                    panelDescriptionStyle
                  }
                >
                  Control how certificates are
                  issued and when renewal reminders
                  should appear.
                </p>
              </div>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Issue automatically"
                description="Issue the certificate as soon as the employee completes the learning."
                checked={issueAutomatically}
                onChange={
                  setIssueAutomatically
                }
              />

              <CheckboxField
                label="Manager approval required"
                description="Require a manager to approve the completion before the certificate is issued."
                checked={
                  managerApprovalRequired
                }
                onChange={
                  setManagerApprovalRequired
                }
              />

              <CheckboxField
                label="Renewal required"
                description="The certificate expires and the learning must be renewed."
                checked={renewalRequired}
                onChange={setRenewalRequired}
              />
            </div>

            {renewalRequired && (
              <FormField label="Renewal reminder days">
                <input
                  type="number"
                  min="1"
                  value={
                    renewalReminderDays
                  }
                  onChange={(event) =>
                    setRenewalReminderDays(
                      event.target.value
                    )
                  }
                  placeholder="For example, 30"
                  style={inputStyle}
                />
              </FormField>
            )}
          </div>

          <div style={settingsPanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h4 style={panelTitleStyle}>
                  Signatory
                </h4>

                <p
                  style={
                    panelDescriptionStyle
                  }
                >
                  Record the name and role shown on
                  the certificate.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <FormField label="Signatory name">
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(event) =>
                    setSignatoryName(
                      event.target.value
                    )
                  }
                  placeholder="For example, Lindsay Gallagher"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Signatory role">
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(event) =>
                    setSignatoryRole(
                      event.target.value
                    )
                  }
                  placeholder="For example, HR Director"
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Internal notes">
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Optional internal notes about the certificate or renewal arrangements."
                style={textareaStyle}
              />
            </FormField>
          </div>

          <div style={actionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveCertificateSettings()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save Certificate Settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={checkboxCardStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span>
        <span style={checkboxTitleStyle}>
          {label}
        </span>

        <span
          style={
            checkboxDescriptionStyle
          }
        >
          {description}
        </span>
      </span>
    </label>
  );
}

const headerStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "15px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const settingsPanelStyle: React.CSSProperties = {
  padding: "17px",
  marginBottom: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: "4px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.45,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "10px",
  marginTop: "15px",
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#F9FAFB",
  cursor: "pointer",
};

const checkboxTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const checkboxDescriptionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.4,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "18px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const loadingStyle: React.CSSProperties = {
  padding: "26px",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};