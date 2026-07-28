"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BrandWorkspaceProps = { organisationId: string };
type JsonObject = Record<string, unknown>;
type Notice = { type: "success" | "error"; message: string } | null;
type TemplateSource = "leo_standard" | "organisation";
type DocumentLayout = "branded" | "plain";
type HeaderStyle = "standard" | "minimal" | "none";
type FooterStyle = "standard" | "compact" | "none";
type DefaultOutput = "docx" | "pdf";

type OrganisationTemplate = {
  id: string;
  name: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
};

type DocumentSettings = {
  tradingName: string;
  registeredName: string;
  address: string;
  telephone: string;
  email: string;
  companyNumber: string;
  vatNumber: string;
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  confidentialityStatement: string;
  pageNumbers: boolean;
  confidentialWatermark: boolean;
  defaultOutput: DefaultOutput;
  templateSource: TemplateSource;
  documentLayout: DocumentLayout;
  organisationTemplates: OrganisationTemplate[];
};

type BrandProfile = {
  id: string;
  organisation_id: string;
  organisation_slug: string;
  display_name: string;
  logo_url: string | null;
  website_url: string | null;
  careers_email: string | null;
  careers_phone: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  metadata: JsonObject;
};

type OrganisationSummary = {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
};

const STORAGE_BUCKET = "organisation-brand-assets";
const PROFILE_SELECT =
  "id, organisation_id, organisation_slug, display_name, logo_url, website_url, careers_email, careers_phone, primary_colour, secondary_colour, metadata" as const;

const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  tradingName: "",
  registeredName: "",
  address: "",
  telephone: "",
  email: "",
  companyNumber: "",
  vatNumber: "",
  headerStyle: "standard",
  footerStyle: "standard",
  confidentialityStatement:
    "Confidential. This document contains personal information and is intended only for the named recipient.",
  pageNumbers: true,
  confidentialWatermark: false,
  defaultOutput: "docx",
  templateSource: "leo_standard",
  documentLayout: "branded",
  organisationTemplates: [],
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}
function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}
function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function normaliseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
function isValidHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}
function isValidEmail(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function cleanFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function parseTemplates(value: unknown): OrganisationTemplate[] {
  return asArray(value)
    .map((item) => {
      const record = asObject(item);
      const id = asString(record.id);
      const name = asString(record.name);
      const fileName = asString(record.file_name);
      const storagePath = asString(record.storage_path);
      const uploadedAt = asString(record.uploaded_at);
      if (!id || !name || !fileName || !storagePath || !uploadedAt) return null;
      return { id, name, fileName, storagePath, uploadedAt };
    })
    .filter((item): item is OrganisationTemplate => Boolean(item));
}

function parseDocumentSettings(metadata: JsonObject): DocumentSettings {
  const settings = asObject(metadata.document_settings);
  const header = asString(settings.header_style);
  const footer = asString(settings.footer_style);
  const output = asString(settings.default_output);
  const source = asString(settings.template_source);
  const layout = asString(settings.document_layout);

  return {
    tradingName: asString(settings.trading_name),
    registeredName: asString(settings.registered_name),
    address: asString(settings.address),
    telephone: asString(settings.telephone),
    email: asString(settings.email),
    companyNumber: asString(settings.company_number),
    vatNumber: asString(settings.vat_number),
    headerStyle: header === "minimal" || header === "none" ? header : "standard",
    footerStyle: footer === "compact" || footer === "none" ? footer : "standard",
    confidentialityStatement: asString(
      settings.confidentiality_statement,
      DEFAULT_DOCUMENT_SETTINGS.confidentialityStatement,
    ),
    pageNumbers: asBoolean(settings.page_numbers, true),
    confidentialWatermark: asBoolean(settings.confidential_watermark, false),
    defaultOutput: output === "pdf" ? "pdf" : "docx",
    templateSource: source === "organisation" ? "organisation" : "leo_standard",
    documentLayout: layout === "plain" ? "plain" : "branded",
    organisationTemplates: parseTemplates(settings.organisation_templates),
  };
}

function parseBrandProfile(value: unknown): BrandProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const organisationId = asString(record.organisation_id);
  const organisationSlug = asString(record.organisation_slug);
  const displayName = asString(record.display_name);
  if (!id || !organisationId || !organisationSlug || !displayName) return null;
  return {
    id,
    organisation_id: organisationId,
    organisation_slug: organisationSlug,
    display_name: displayName,
    logo_url: asNullableString(record.logo_url),
    website_url: asNullableString(record.website_url),
    careers_email: asNullableString(record.careers_email),
    careers_phone: asNullableString(record.careers_phone),
    primary_colour: asNullableString(record.primary_colour),
    secondary_colour: asNullableString(record.secondary_colour),
    metadata: asObject(record.metadata),
  };
}

function parseOrganisationSummary(value: unknown): OrganisationSummary | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    slug: asNullableString(record.slug),
    website_url: asNullableString(record.website_url),
  };
}

export default function BrandWorkspace({ organisationId }: BrandWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);

  const [profileId, setProfileId] = useState("");
  const [metadata, setMetadata] = useState<JsonObject>({});
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [primaryColour, setPrimaryColour] = useState("#6E5084");
  const [secondaryColour, setSecondaryColour] = useState("#F7F1FC");
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(
    DEFAULT_DOCUMENT_SETTINGS,
  );
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  function updateDocumentSetting<K extends keyof DocumentSettings>(
    key: K,
    value: DocumentSettings[K],
  ) {
    setDocumentSettings((current) => ({ ...current, [key]: value }));
  }

  function applyProfile(profile: BrandProfile) {
    const settings = parseDocumentSettings(profile.metadata);
    const brandAssets = asObject(profile.metadata.brand_assets);
    setProfileId(profile.id);
    setMetadata(profile.metadata);
    setDisplayName(profile.display_name);
    setLogoUrl(profile.logo_url ?? "");
    setLogoPath(asString(brandAssets.logo_path));
    setWebsiteUrl(profile.website_url ?? "");
    setPrimaryColour(profile.primary_colour ?? "#6E5084");
    setSecondaryColour(profile.secondary_colour ?? "#F7F1FC");
    setDocumentSettings({
      ...settings,
      telephone: settings.telephone || profile.careers_phone || "",
      email: settings.email || profile.careers_email || "",
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function loadBrand() {
      setLoading(true);
      setPageError("");
      const { data: existingData, error: profileError } = await supabase
        .from("organisation_public_profiles")
        .select(PROFILE_SELECT)
        .eq("organisation_id", organisationId)
        .maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setPageError(profileError.message);
        setLoading(false);
        return;
      }
      const existingProfile = parseBrandProfile(existingData);
      if (existingProfile) {
        applyProfile(existingProfile);
        setLoading(false);
        return;
      }

      const { data: organisationData, error: organisationError } = await supabase
        .from("organisations")
        .select("id, name, slug, website_url")
        .eq("id", organisationId)
        .maybeSingle();
      if (cancelled) return;
      if (organisationError) {
        setPageError(organisationError.message);
        setLoading(false);
        return;
      }
      const organisation = parseOrganisationSummary(organisationData);
      if (!organisation) {
        setPageError("The organisation record could not be found.");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPageError("You must be signed in to create organisation brand settings.");
        setLoading(false);
        return;
      }

      const { data: createdData, error: createError } = await supabase
        .from("organisation_public_profiles")
        .insert({
          organisation_id: organisationId,
          organisation_slug: organisation.slug || `organisation-${organisationId.slice(0, 8)}`,
          display_name: organisation.name,
          website_url: organisation.website_url,
          careers_enabled: false,
          metadata: { document_settings: {}, brand_assets: {} },
          created_by: user.id,
          updated_by: user.id,
        })
        .select(PROFILE_SELECT)
        .single();
      if (cancelled) return;
      if (createError) {
        setPageError(createError.message);
        setLoading(false);
        return;
      }
      const createdProfile = parseBrandProfile(createdData);
      if (!createdProfile) {
        setPageError("The brand record was created but could not be read.");
        setLoading(false);
        return;
      }
      applyProfile(createdProfile);
      setLoading(false);
    }
    void loadBrand();
    return () => { cancelled = true; };
  }, [organisationId, supabase]);

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setNotice({ type: "error", message: "Choose a PNG or JPG logo." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "The logo must be 5 MB or smaller." });
      return;
    }

    setUploadingLogo(true);
    setNotice(null);
    const extension = file.type === "image/png" ? "png" : "jpg";
    const path = `${organisationId}/logo/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
    if (uploadError) {
      setNotice({ type: "error", message: uploadError.message });
      setUploadingLogo(false);
      return;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    if (logoPath) await supabase.storage.from(STORAGE_BUCKET).remove([logoPath]);
    setLogoPath(path);
    setLogoUrl(data.publicUrl);
    setUploadingLogo(false);
    setNotice({ type: "success", message: "Logo uploaded. Save the brand settings to keep it." });
  }

  async function removeLogo() {
    if (logoPath) await supabase.storage.from(STORAGE_BUCKET).remove([logoPath]);
    setLogoPath("");
    setLogoUrl("");
    setNotice({ type: "success", message: "Logo removed. Save the brand settings to confirm." });
  }

  async function uploadTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setNotice({ type: "error", message: "Organisation templates must be Word .docx files." });
      return;
    }
    if (!templateName.trim()) {
      setNotice({ type: "error", message: "Enter a template name before choosing the file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice({ type: "error", message: "The template must be 10 MB or smaller." });
      return;
    }

    setUploadingTemplate(true);
    setNotice(null);
    const id = crypto.randomUUID();
    const path = `${organisationId}/templates/${id}-${cleanFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    if (error) {
      setNotice({ type: "error", message: error.message });
      setUploadingTemplate(false);
      return;
    }
    const template: OrganisationTemplate = {
      id,
      name: templateName.trim(),
      fileName: file.name,
      storagePath: path,
      uploadedAt: new Date().toISOString(),
    };
    updateDocumentSetting("organisationTemplates", [
      ...documentSettings.organisationTemplates,
      template,
    ]);
    updateDocumentSetting("templateSource", "organisation");
    setTemplateName("");
    setUploadingTemplate(false);
    setNotice({ type: "success", message: "Template uploaded. Save the brand settings to keep it." });
  }

  async function removeTemplate(template: OrganisationTemplate) {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([template.storagePath]);
    if (error) {
      setNotice({ type: "error", message: error.message });
      return;
    }
    const remaining = documentSettings.organisationTemplates.filter((item) => item.id !== template.id);
    setDocumentSettings((current) => ({
      ...current,
      organisationTemplates: remaining,
      templateSource: remaining.length === 0 ? "leo_standard" : current.templateSource,
    }));
    setNotice({ type: "success", message: "Template removed. Save the brand settings to confirm." });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileId || !displayName.trim()) {
      setNotice({ type: "error", message: "Enter the organisation display name." });
      return;
    }
    if (!isValidEmail(documentSettings.email)) {
      setNotice({ type: "error", message: "Enter a valid organisation email address." });
      return;
    }
    if (!isValidHex(primaryColour) || !isValidHex(secondaryColour)) {
      setNotice({ type: "error", message: "Brand colours must use six-digit hex codes." });
      return;
    }
    try {
      const website = normaliseUrl(websiteUrl);
      if (website) new URL(website);
    } catch {
      setNotice({ type: "error", message: "Check the website address before saving." });
      return;
    }

    setSaving(true);
    setNotice(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setNotice({ type: "error", message: "You must be signed in to update organisation branding." });
      setSaving(false);
      return;
    }

    const nextMetadata = {
      ...metadata,
      brand_assets: { ...asObject(metadata.brand_assets), logo_path: logoPath || null },
      document_settings: {
        trading_name: documentSettings.tradingName.trim() || null,
        registered_name: documentSettings.registeredName.trim() || null,
        address: documentSettings.address.trim() || null,
        telephone: documentSettings.telephone.trim() || null,
        email: documentSettings.email.trim() || null,
        company_number: documentSettings.companyNumber.trim() || null,
        vat_number: documentSettings.vatNumber.trim() || null,
        header_style: documentSettings.headerStyle,
        footer_style: documentSettings.footerStyle,
        confidentiality_statement: documentSettings.confidentialityStatement.trim() || null,
        page_numbers: documentSettings.pageNumbers,
        confidential_watermark: documentSettings.confidentialWatermark,
        default_output: documentSettings.defaultOutput,
        template_source: documentSettings.templateSource,
        document_layout: documentSettings.documentLayout,
        organisation_templates: documentSettings.organisationTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          file_name: template.fileName,
          storage_path: template.storagePath,
          uploaded_at: template.uploadedAt,
        })),
      },
    };

    const { data: updatedData, error } = await supabase
      .from("organisation_public_profiles")
      .update({
        display_name: displayName.trim(),
        logo_url: logoUrl || null,
        hero_image_url: null,
        website_url: normaliseUrl(websiteUrl),
        careers_email: documentSettings.email.trim() || null,
        careers_phone: documentSettings.telephone.trim() || null,
        primary_colour: primaryColour.toUpperCase(),
        secondary_colour: secondaryColour.toUpperCase(),
        metadata: nextMetadata,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("organisation_id", organisationId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      setNotice({ type: "error", message: error.message });
      setSaving(false);
      return;
    }
    const updatedProfile = parseBrandProfile(updatedData);
    if (!updatedProfile) {
      setNotice({ type: "error", message: "The settings were saved but could not be refreshed." });
      setSaving(false);
      return;
    }
    applyProfile(updatedProfile);
    setSaving(false);
    setNotice({ type: "success", message: "Organisation brand and document settings have been saved." });
  }

  if (loading) return <section className="brand-workspace"><div className="state">Loading brand settings…</div><style>{styles}</style></section>;
  if (pageError) return <section className="brand-workspace"><div className="state error"><h2>Brand settings could not be loaded</h2><p>{pageError}</p></div><style>{styles}</style></section>;

  const templates = documentSettings.organisationTemplates;
  const brandingReady = Boolean(logoUrl || primaryColour !== "#6E5084" || secondaryColour !== "#F7F1FC");

  return (
    <section className="brand-workspace">
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">Organisation identity</p>
          <h2>Brand</h2>
          <p>Manage the identity and document presentation used throughout LEO.</p>
        </div>
      </header>

      <div className="summary-grid">
        <article><span>Organisation brand</span><strong>{brandingReady ? "Configured" : "LEO default"}</strong><small>Logo, colours and organisation identity</small></article>
        <article><span>Document wording</span><strong>{documentSettings.templateSource === "leo_standard" ? "LEO Standard" : "Organisation"}</strong><small>{templates.length} organisation template{templates.length === 1 ? "" : "s"}</small></article>
        <article><span>Document appearance</span><strong>{documentSettings.documentLayout === "branded" ? "Branded" : "Plain"}</strong><small>Default output: {documentSettings.defaultOutput.toUpperCase()}</small></article>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <section className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Identity</p><h3>Organisation brand</h3><p>Upload the organisation logo and set the colours and names used in generated documents.</p></div></div>
          <div className="form-grid two-column">
            <label className="field"><span>Display name</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required disabled={saving} /></label>
            <label className="field"><span>Trading name</span><input value={documentSettings.tradingName} onChange={(e) => updateDocumentSetting("tradingName", e.target.value)} disabled={saving} /></label>
            <label className="field"><span>Registered name</span><input value={documentSettings.registeredName} onChange={(e) => updateDocumentSetting("registeredName", e.target.value)} disabled={saving} /></label>
            <label className="field"><span>Website</span><input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://www.example.co.uk" disabled={saving} /></label>
          </div>

          <div className="logo-uploader">
            <div className="logo-preview">{logoUrl ? <img src={logoUrl} alt={`${displayName || "Organisation"} logo`} /> : <span>No logo uploaded</span>}</div>
            <div>
              <strong>Organisation logo</strong>
              <p>PNG or JPG. Maximum file size 5 MB.</p>
              <div className="inline-actions">
                <label className="secondary button-label">{uploadingLogo ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}<input type="file" accept="image/png,image/jpeg" onChange={uploadLogo} disabled={saving || uploadingLogo} /></label>
                {logoUrl ? <button type="button" className="text-button danger" onClick={removeLogo} disabled={saving || uploadingLogo}>Remove logo</button> : null}
              </div>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field colour-field"><span>Primary colour</span><div className="colour-input-row"><input type="color" value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} /><input value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} maxLength={7} /></div></label>
            <label className="field colour-field"><span>Secondary colour</span><div className="colour-input-row"><input type="color" value={secondaryColour} onChange={(e) => setSecondaryColour(e.target.value)} /><input value={secondaryColour} onChange={(e) => setSecondaryColour(e.target.value)} maxLength={7} /></div></label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Details</p><h3>Document identity</h3><p>These details can appear in headers, footers and generated correspondence.</p></div></div>
          <div className="form-grid two-column">
            <label className="field full-width"><span>Address</span><textarea rows={4} value={documentSettings.address} onChange={(e) => updateDocumentSetting("address", e.target.value)} /></label>
            <label className="field"><span>Telephone</span><input type="tel" value={documentSettings.telephone} onChange={(e) => updateDocumentSetting("telephone", e.target.value)} /></label>
            <label className="field"><span>Email</span><input type="email" value={documentSettings.email} onChange={(e) => updateDocumentSetting("email", e.target.value)} /></label>
            <label className="field"><span>Company registration number</span><input value={documentSettings.companyNumber} onChange={(e) => updateDocumentSetting("companyNumber", e.target.value)} /></label>
            <label className="field"><span>VAT number</span><input value={documentSettings.vatNumber} onChange={(e) => updateDocumentSetting("vatNumber", e.target.value)} /></label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Templates</p><h3>Document wording</h3><p>Choose whether generated documents use LEO wording or your organisation’s approved templates.</p></div></div>
          <div className="choice-grid two">
            <button type="button" className={`choice-card ${documentSettings.templateSource === "leo_standard" ? "selected" : ""}`} onClick={() => updateDocumentSetting("templateSource", "leo_standard")}><span className="choice-check">{documentSettings.templateSource === "leo_standard" ? "✓" : ""}</span><strong>LEO Standard</strong><small>Professionally structured wording maintained by LEO.</small></button>
            <button type="button" className={`choice-card ${documentSettings.templateSource === "organisation" ? "selected" : ""}`} onClick={() => updateDocumentSetting("templateSource", "organisation")}><span className="choice-check">{documentSettings.templateSource === "organisation" ? "✓" : ""}</span><strong>Organisation templates</strong><small>Use your own approved Word templates.</small></button>
          </div>

          <div className="template-manager">
            <div className="template-add">
              <label className="field"><span>Template name</span><input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Disciplinary invitation" /></label>
              <label className="secondary button-label">{uploadingTemplate ? "Uploading…" : "Add Word template"}<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadTemplate} disabled={uploadingTemplate || saving} /></label>
            </div>
            {templates.length === 0 ? <div className="empty-template">No organisation templates have been added yet.</div> : <div className="template-list">{templates.map((template) => <article key={template.id}><div><strong>{template.name}</strong><span>{template.fileName}</span><small>Uploaded {new Date(template.uploadedAt).toLocaleDateString("en-GB")}</small></div><button type="button" className="text-button danger" onClick={() => removeTemplate(template)}>Remove</button></article>)}</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Appearance</p><h3>Document presentation</h3><p>Choose the default look used by generated documents.</p></div></div>
          <div className="choice-grid three">
            <button type="button" className={`choice-card ${documentSettings.documentLayout === "branded" ? "selected" : ""}`} onClick={() => updateDocumentSetting("documentLayout", "branded")}><span className="choice-check">{documentSettings.documentLayout === "branded" ? "✓" : ""}</span><strong>Branded layout</strong><small>Uses your logo, colours and organisation details.</small></button>
            <button type="button" className={`choice-card ${documentSettings.documentLayout === "plain" ? "selected" : ""}`} onClick={() => updateDocumentSetting("documentLayout", "plain")}><span className="choice-check">{documentSettings.documentLayout === "plain" ? "✓" : ""}</span><strong>Plain document</strong><small>Clean black-and-white formatting without branding.</small></button>
            <div className="choice-card disabled" aria-disabled="true"><span className="badge">Coming later</span><strong>Word letterhead</strong><small>Use an uploaded organisation letterhead as the document shell.</small></div>
          </div>

          <div className="form-grid two-column">
            <label className="field"><span>Default output</span><select value={documentSettings.defaultOutput} onChange={(e) => updateDocumentSetting("defaultOutput", e.target.value as DefaultOutput)}><option value="docx">Word document (.docx)</option><option value="pdf">PDF document</option></select></label>
            <label className="field"><span>Header style</span><select value={documentSettings.headerStyle} onChange={(e) => updateDocumentSetting("headerStyle", e.target.value as HeaderStyle)}><option value="standard">Standard</option><option value="minimal">Minimal</option><option value="none">No header</option></select></label>
            <label className="field"><span>Footer style</span><select value={documentSettings.footerStyle} onChange={(e) => updateDocumentSetting("footerStyle", e.target.value as FooterStyle)}><option value="standard">Standard</option><option value="compact">Compact</option><option value="none">No footer</option></select></label>
            <label className="field full-width"><span>Confidentiality statement</span><textarea rows={3} value={documentSettings.confidentialityStatement} onChange={(e) => updateDocumentSetting("confidentialityStatement", e.target.value)} /></label>
          </div>
          <div className="toggle-grid">
            <label className="toggle-row"><div><strong>Page numbers</strong><span>Show page numbers on generated documents.</span></div><input type="checkbox" checked={documentSettings.pageNumbers} onChange={(e) => updateDocumentSetting("pageNumbers", e.target.checked)} /></label>
            <label className="toggle-row"><div><strong>Confidential watermark</strong><span>Add a confidential watermark where supported.</span></div><input type="checkbox" checked={documentSettings.confidentialWatermark} onChange={(e) => updateDocumentSetting("confidentialWatermark", e.target.checked)} /></label>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="panel-heading"><div><p className="eyebrow">Preview</p><h3>Brand preview</h3><p>This shows the current branded layout before you save it.</p></div></div>
          <div className={`document-preview ${documentSettings.documentLayout}`}>
            <div className="preview-header" style={{ borderColor: primaryColour }}>
              {documentSettings.documentLayout === "branded" && logoUrl ? <img src={logoUrl} alt="" /> : null}
              <div><strong>{documentSettings.tradingName || displayName || "Organisation name"}</strong><span>Generated document</span></div>
            </div>
            <div className="preview-body"><h4 style={{ color: documentSettings.documentLayout === "branded" ? primaryColour : "#222" }}>Document title</h4><p>This is an example of how organisation information and document styling will appear.</p><div className="preview-line" /><div className="preview-line short" /></div>
            <div className="preview-footer" style={{ backgroundColor: documentSettings.documentLayout === "branded" ? secondaryColour : "#f5f5f5" }}><span>{documentSettings.confidentialityStatement || "Confidential"}</span>{documentSettings.pageNumbers ? <strong>Page 1</strong> : null}</div>
          </div>
        </section>

        {notice ? <div className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.message}</div> : null}
        <div className="form-actions"><button type="submit" className="primary" disabled={saving || uploadingLogo || uploadingTemplate}>{saving ? "Saving…" : "Save brand settings"}</button></div>
      </form>
      <style>{styles}</style>
    </section>
  );
}

const styles = `.brand-workspace{display:grid;gap:24px;color:#2f2635}.brand-workspace *{box-sizing:border-box}.workspace-heading h2,.panel-heading h3{margin:0}.workspace-heading p:not(.eyebrow),.panel-heading p:not(.eyebrow){margin:8px 0 0;color:#716777;line-height:1.6}.eyebrow{margin:0 0 7px;color:#6e5084;font-size:.74rem;font-weight:850;letter-spacing:.11em;text-transform:uppercase}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.summary-grid article,.panel{border:1px solid #e6ddea;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(75,55,84,.055)}.summary-grid article{padding:20px}.summary-grid span,.summary-grid small{display:block;color:#716777}.summary-grid strong{display:block;margin:8px 0 4px;font-size:1.4rem}.settings-form{display:grid;gap:18px}.panel{padding:22px}.form-grid{display:grid;gap:16px;margin-top:20px}.two-column{grid-template-columns:repeat(2,minmax(0,1fr))}.field{display:grid;gap:8px}.field.full-width{grid-column:1/-1}.field>span{font-size:.84rem;font-weight:800}.field input,.field textarea,.field select{width:100%;border:1px solid #d9cfdd;border-radius:12px;background:#fff;padding:12px 13px;color:#332a37;font:inherit}.field textarea{resize:vertical}.colour-input-row{display:grid;grid-template-columns:54px 1fr;gap:10px}.colour-input-row input[type=color]{padding:4px}.logo-uploader{display:grid;grid-template-columns:150px 1fr;gap:20px;align-items:center;margin-top:20px;padding:18px;border:1px solid #e6ddea;border-radius:16px;background:#fcfafc}.logo-preview{height:100px;display:grid;place-items:center;border:1px dashed #cfc2d5;border-radius:14px;background:#fff;color:#827786}.logo-preview img{max-width:120px;max-height:78px;object-fit:contain}.logo-uploader p{margin:6px 0 12px;color:#716777}.inline-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.button-label{position:relative;overflow:hidden}.button-label input{position:absolute;inset:0;opacity:0;cursor:pointer}.primary,.secondary{min-height:42px;padding:0 16px;border-radius:11px;font:inherit;font-weight:800;cursor:pointer}.primary{border:1px solid #6e5084;background:#6e5084;color:#fff}.secondary{display:inline-grid;place-items:center;border:1px solid #cdb2e2;background:#fff;color:#6e5084}.text-button{border:0;background:none;font:inherit;font-weight:800;cursor:pointer}.danger{color:#a33b4b}.choice-grid{display:grid;gap:13px;margin-top:18px}.choice-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.choice-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.choice-card{position:relative;display:grid;gap:7px;min-height:135px;padding:18px;border:1px solid #e3d8e8;border-radius:16px;background:#fff;text-align:left;color:#332a37;cursor:pointer}.choice-card.selected{border:2px solid #6e5084;background:#f7f1fc}.choice-card.disabled{cursor:not-allowed;opacity:.65}.choice-card small{color:#716777;line-height:1.45}.choice-check{position:absolute;right:14px;top:12px;width:24px;height:24px;display:grid;place-items:center;border:1px solid #d4c8da;border-radius:50%;color:#6e5084;font-weight:900}.badge{justify-self:start;padding:4px 8px;border-radius:999px;background:#eee8f2;color:#6e5084;font-size:.72rem;font-weight:850}.template-manager{margin-top:18px;padding:16px;border:1px solid #e6ddea;border-radius:16px;background:#fcfafc}.template-add{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}.empty-template{margin-top:14px;padding:18px;border:1px dashed #d9cfdd;border-radius:12px;color:#776d7b;text-align:center}.template-list{display:grid;gap:10px;margin-top:14px}.template-list article{display:flex;justify-content:space-between;gap:16px;padding:14px;border:1px solid #e4dce7;border-radius:12px;background:#fff}.template-list span,.template-list small{display:block;margin-top:4px;color:#776d7b}.toggle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.toggle-row{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:16px;border:1px solid #e6ddea;border-radius:15px;background:#fcfafc}.toggle-row span{display:block;margin-top:4px;color:#786e7c;font-size:.84rem}.toggle-row input{width:20px;height:20px;accent-color:#6e5084}.document-preview{max-width:760px;margin:20px auto 0;border:1px solid #d9cfdd;border-radius:10px;background:#fff;box-shadow:0 18px 40px rgba(40,31,45,.1);overflow:hidden}.preview-header{display:flex;gap:16px;align-items:center;padding:22px;border-bottom:4px solid}.preview-header img{width:82px;height:52px;object-fit:contain}.preview-header strong,.preview-header span{display:block}.preview-header span{margin-top:4px;color:#746a78}.preview-body{min-height:260px;padding:38px}.preview-body h4{font-size:1.35rem}.preview-body p{max-width:540px;color:#6f6672;line-height:1.6}.preview-line{height:9px;margin-top:22px;border-radius:999px;background:#eee9f0}.preview-line.short{width:62%}.preview-footer{display:flex;justify-content:space-between;gap:20px;padding:14px 20px;font-size:.76rem}.document-preview.plain .preview-header{border-color:#222!important}.notice{padding:14px 16px;border-radius:14px;font-weight:750}.notice.success{border:1px solid #cfe9da;background:#eef9f3;color:#246b46}.notice.error{border:1px solid #f1d0d6;background:#fff3f5;color:#963746}.form-actions{display:flex;justify-content:flex-end}.state{padding:40px;border:1px dashed #d9cfdd;border-radius:18px;background:#fcfafc;text-align:center}.state.error{color:#963746}@media(max-width:900px){.summary-grid,.choice-grid.three{grid-template-columns:1fr}.toggle-grid{grid-template-columns:1fr}}@media(max-width:700px){.two-column,.choice-grid.two,.template-add,.logo-uploader{grid-template-columns:1fr}.field.full-width{grid-column:auto}.form-actions,.primary{width:100%}}`;