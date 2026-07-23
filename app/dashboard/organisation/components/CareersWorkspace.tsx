"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CareersWorkspaceProps = {
  organisationId: string;
};

type CareersProfile = {
  id: string;
  organisation_id: string;
  organisation_slug: string;
  display_name: string;
  careers_heading: string | null;
  careers_intro: string | null;
  about_organisation: string | null;
  benefits_summary: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  website_url: string | null;
  careers_email: string | null;
  careers_phone: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  careers_enabled: boolean;
  show_closed_vacancies: boolean;
};

type OrganisationSummary = {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
};

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const PROFILE_SELECT =
  "id, organisation_id, organisation_slug, display_name, careers_heading, careers_intro, about_organisation, benefits_summary, logo_url, hero_image_url, website_url, careers_email, careers_phone, linkedin_url, facebook_url, instagram_url, primary_colour, secondary_colour, careers_enabled, show_closed_vacancies" as const;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function parseCareersProfile(value: unknown): CareersProfile | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  const id = asString(record.id);
  const organisationId = asString(record.organisation_id);
  const organisationSlug = asString(record.organisation_slug);
  const displayName = asString(record.display_name);

  if (!id || !organisationId || !organisationSlug || !displayName) {
    return null;
  }

  return {
    id,
    organisation_id: organisationId,
    organisation_slug: organisationSlug,
    display_name: displayName,
    careers_heading: asNullableString(record.careers_heading),
    careers_intro: asNullableString(record.careers_intro),
    about_organisation: asNullableString(record.about_organisation),
    benefits_summary: asNullableString(record.benefits_summary),
    logo_url: asNullableString(record.logo_url),
    hero_image_url: asNullableString(record.hero_image_url),
    website_url: asNullableString(record.website_url),
    careers_email: asNullableString(record.careers_email),
    careers_phone: asNullableString(record.careers_phone),
    linkedin_url: asNullableString(record.linkedin_url),
    facebook_url: asNullableString(record.facebook_url),
    instagram_url: asNullableString(record.instagram_url),
    primary_colour: asNullableString(record.primary_colour),
    secondary_colour: asNullableString(record.secondary_colour),
    careers_enabled: asBoolean(record.careers_enabled),
    show_closed_vacancies: asBoolean(record.show_closed_vacancies),
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

function normaliseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function CareersWorkspace({
  organisationId,
}: CareersWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);

  const [profileId, setProfileId] = useState("");
  const [organisationSlug, setOrganisationSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [careersHeading, setCareersHeading] = useState("");
  const [careersIntro, setCareersIntro] = useState("");
  const [aboutOrganisation, setAboutOrganisation] = useState("");
  const [benefitsSummary, setBenefitsSummary] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [careersEmail, setCareersEmail] = useState("");
  const [careersPhone, setCareersPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [primaryColour, setPrimaryColour] = useState("#6E5084");
  const [secondaryColour, setSecondaryColour] = useState("#F7F1FC");
  const [careersEnabled, setCareersEnabled] = useState(false);
  const [showClosedVacancies, setShowClosedVacancies] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const publicPath = organisationSlug ? `/careers/${organisationSlug}` : "";

  function applyProfile(profile: CareersProfile) {
    setProfileId(profile.id);
    setOrganisationSlug(profile.organisation_slug);
    setDisplayName(profile.display_name);
    setCareersHeading(profile.careers_heading ?? "");
    setCareersIntro(profile.careers_intro ?? "");
    setAboutOrganisation(profile.about_organisation ?? "");
    setBenefitsSummary(profile.benefits_summary ?? "");
    setLogoUrl(profile.logo_url ?? "");
    setHeroImageUrl(profile.hero_image_url ?? "");
    setWebsiteUrl(profile.website_url ?? "");
    setCareersEmail(profile.careers_email ?? "");
    setCareersPhone(profile.careers_phone ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setFacebookUrl(profile.facebook_url ?? "");
    setInstagramUrl(profile.instagram_url ?? "");
    setPrimaryColour(profile.primary_colour ?? "#6E5084");
    setSecondaryColour(profile.secondary_colour ?? "#F7F1FC");
    setCareersEnabled(profile.careers_enabled);
    setShowClosedVacancies(profile.show_closed_vacancies);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setPageError("");
      setNotice(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        setPageError(
          userError?.message ||
            "Your Careers settings could not be loaded because you are not signed in.",
        );
        setLoading(false);
        return;
      }

      const { data: existingProfileData, error: profileError } = await supabase
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

      const existingProfile = parseCareersProfile(existingProfileData);

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

      const fallbackSlug =
        organisation.slug || `organisation-${organisationId.slice(0, 8)}`;

      const { data: createdProfileData, error: createError } = await supabase
        .from("organisation_public_profiles")
        .insert({
          organisation_id: organisationId,
          organisation_slug: fallbackSlug,
          display_name: organisation.name,
          website_url: organisation.website_url,
          careers_enabled: false,
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

      const createdProfile = parseCareersProfile(createdProfileData);

      if (!createdProfile) {
        setPageError("The public Careers profile was created but could not be read.");
        setLoading(false);
        return;
      }

      applyProfile(createdProfile);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [organisationId, supabase]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileId) {
      setNotice({
        type: "error",
        message: "The Careers profile is not ready to save.",
      });
      return;
    }

    if (!displayName.trim()) {
      setNotice({
        type: "error",
        message: "Enter the organisation name shown on the public Careers page.",
      });
      return;
    }

    if (!isValidEmail(careersEmail)) {
      setNotice({
        type: "error",
        message: "Enter a valid Careers email address.",
      });
      return;
    }

    if (!isValidHex(primaryColour) || !isValidHex(secondaryColour)) {
      setNotice({
        type: "error",
        message: "Brand colours must use a six-digit hex code, such as #6E5084.",
      });
      return;
    }

    const urlValues = [
      websiteUrl,
      logoUrl,
      heroImageUrl,
      linkedinUrl,
      facebookUrl,
      instagramUrl,
    ];

    try {
      for (const value of urlValues) {
        const normalised = normaliseUrl(value);
        if (normalised) new URL(normalised);
      }
    } catch {
      setNotice({
        type: "error",
        message: "Check the website, image and social links before saving.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice({
        type: "error",
        message:
          userError?.message || "You must be signed in to update Careers settings.",
      });
      setSaving(false);
      return;
    }

    const { data: updatedProfileData, error } = await supabase
      .from("organisation_public_profiles")
      .update({
        display_name: displayName.trim(),
        careers_heading: careersHeading.trim() || null,
        careers_intro: careersIntro.trim() || null,
        about_organisation: aboutOrganisation.trim() || null,
        benefits_summary: benefitsSummary.trim() || null,
        logo_url: normaliseUrl(logoUrl),
        hero_image_url: normaliseUrl(heroImageUrl),
        website_url: normaliseUrl(websiteUrl),
        careers_email: careersEmail.trim() || null,
        careers_phone: careersPhone.trim() || null,
        linkedin_url: normaliseUrl(linkedinUrl),
        facebook_url: normaliseUrl(facebookUrl),
        instagram_url: normaliseUrl(instagramUrl),
        primary_colour: primaryColour.toUpperCase(),
        secondary_colour: secondaryColour.toUpperCase(),
        careers_enabled: careersEnabled,
        show_closed_vacancies: showClosedVacancies,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("organisation_id", organisationId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
      setSaving(false);
      return;
    }

    const updatedProfile = parseCareersProfile(updatedProfileData);

    if (!updatedProfile) {
      setNotice({
        type: "error",
        message: "The Careers settings were saved but could not be refreshed.",
      });
      setSaving(false);
      return;
    }

    applyProfile(updatedProfile);
    setNotice({
      type: "success",
      message: "Careers settings have been saved.",
    });
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="careers-workspace">
        <div className="loading-card" aria-live="polite">
          <div className="loading-line loading-line-wide" />
          <div className="loading-line" />
          <div className="loading-line loading-line-short" />
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="careers-workspace">
        <section className="error-card" role="alert">
          <p className="eyebrow">Unable to load</p>
          <h2>Careers settings are unavailable</h2>
          <p>{pageError}</p>
        </section>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="careers-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Public Careers</p>
          <h2>Careers page settings</h2>
          <p>
            Manage the organisation information, branding and contact details
            shown to candidates on the public Careers page.
          </p>
        </div>

        <div className="heading-actions">
          {publicPath ? (
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              Open public page
            </a>
          ) : null}
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <section className="settings-card status-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visibility</p>
              <h3>Public Careers page</h3>
              <p>
                Control whether candidates can access the organisation&apos;s
                public vacancy page.
              </p>
            </div>

            <label className="switch-field">
              <input
                type="checkbox"
                checked={careersEnabled}
                onChange={(event) => setCareersEnabled(event.target.checked)}
                disabled={saving}
              />
              <span className="switch" aria-hidden="true" />
              <span>{careersEnabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>

          <div className="public-url-row">
            <div>
              <span>Public page address</span>
              <strong>{publicPath || "Not available"}</strong>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showClosedVacancies}
                onChange={(event) =>
                  setShowClosedVacancies(event.target.checked)
                }
                disabled={saving}
              />
              <span>Show closed vacancies</span>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="section-heading simple">
            <div>
              <p className="eyebrow">Page content</p>
              <h3>Organisation introduction</h3>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field full-width">
              <span>Organisation name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={180}
                disabled={saving}
                required
              />
            </label>

            <label className="field full-width">
              <span>Careers heading</span>
              <input
                type="text"
                value={careersHeading}
                onChange={(event) => setCareersHeading(event.target.value)}
                placeholder="Join our team"
                maxLength={180}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Careers introduction</span>
              <textarea
                value={careersIntro}
                onChange={(event) => setCareersIntro(event.target.value)}
                placeholder="Introduce candidates to the organisation and the opportunities available."
                rows={4}
                maxLength={1200}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>About the organisation</span>
              <textarea
                value={aboutOrganisation}
                onChange={(event) => setAboutOrganisation(event.target.value)}
                placeholder="Describe the organisation, its purpose and working environment."
                rows={6}
                maxLength={3000}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Benefits summary</span>
              <textarea
                value={benefitsSummary}
                onChange={(event) => setBenefitsSummary(event.target.value)}
                placeholder="Summarise the benefits and employee experience offered."
                rows={5}
                maxLength={2500}
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="section-heading simple">
            <div>
              <p className="eyebrow">Contact</p>
              <h3>Candidate contact details</h3>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field">
              <span>Careers email</span>
              <input
                type="email"
                value={careersEmail}
                onChange={(event) => setCareersEmail(event.target.value)}
                placeholder="careers@example.co.uk"
                maxLength={254}
                disabled={saving}
              />
            </label>

            <label className="field">
              <span>Careers phone</span>
              <input
                type="tel"
                value={careersPhone}
                onChange={(event) => setCareersPhone(event.target.value)}
                placeholder="01722 000000"
                maxLength={40}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Website</span>
              <input
                type="text"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://www.example.co.uk"
                maxLength={300}
                disabled={saving}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="section-heading simple">
            <div>
              <p className="eyebrow">Branding</p>
              <h3>Images and colours</h3>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field full-width">
              <span>Logo image URL</span>
              <input
                type="text"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                maxLength={500}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Hero image URL</span>
              <input
                type="text"
                value={heroImageUrl}
                onChange={(event) => setHeroImageUrl(event.target.value)}
                placeholder="https://..."
                maxLength={500}
                disabled={saving}
              />
            </label>

            <label className="field colour-field">
              <span>Primary colour</span>
              <div className="colour-input-row">
                <input
                  type="color"
                  value={primaryColour}
                  onChange={(event) => setPrimaryColour(event.target.value)}
                  disabled={saving}
                  aria-label="Primary colour picker"
                />
                <input
                  type="text"
                  value={primaryColour}
                  onChange={(event) => setPrimaryColour(event.target.value)}
                  maxLength={7}
                  disabled={saving}
                />
              </div>
            </label>

            <label className="field colour-field">
              <span>Secondary colour</span>
              <div className="colour-input-row">
                <input
                  type="color"
                  value={secondaryColour}
                  onChange={(event) => setSecondaryColour(event.target.value)}
                  disabled={saving}
                  aria-label="Secondary colour picker"
                />
                <input
                  type="text"
                  value={secondaryColour}
                  onChange={(event) => setSecondaryColour(event.target.value)}
                  maxLength={7}
                  disabled={saving}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="section-heading simple">
            <div>
              <p className="eyebrow">Social links</p>
              <h3>Organisation channels</h3>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field full-width">
              <span>LinkedIn</span>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                placeholder="https://www.linkedin.com/company/..."
                maxLength={500}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Facebook</span>
              <input
                type="text"
                value={facebookUrl}
                onChange={(event) => setFacebookUrl(event.target.value)}
                placeholder="https://www.facebook.com/..."
                maxLength={500}
                disabled={saving}
              />
            </label>

            <label className="field full-width">
              <span>Instagram</span>
              <input
                type="text"
                value={instagramUrl}
                onChange={(event) => setInstagramUrl(event.target.value)}
                placeholder="https://www.instagram.com/..."
                maxLength={500}
                disabled={saving}
              />
            </label>
          </div>
        </section>

        {notice ? (
          <div
            className={`notice ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Careers settings"}
          </button>
        </div>
      </form>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
.careers-workspace{display:grid;gap:22px;color:#302637}
.workspace-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
.workspace-heading h2,.section-heading h3{margin:0;color:#2f2635}
.workspace-heading h2{font-size:1.6rem}
.workspace-heading p:not(.eyebrow),.section-heading p:not(.eyebrow){max-width:760px;margin:8px 0 0;color:#746a78;line-height:1.6}
.eyebrow{margin:0 0 7px;color:#6e5084;font-size:.75rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase}
.heading-actions{display:flex;gap:10px;flex:0 0 auto}
.secondary-button,.primary-button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:0 17px;font-weight:850;text-decoration:none;cursor:pointer}
.secondary-button{border:1px solid #cdb2e2;background:#fff;color:#6e5084}
.primary-button{border:0;background:#6e5084;color:#fff}
.primary-button:disabled{opacity:.6;cursor:not-allowed}
.settings-form{display:grid;gap:18px}
.settings-card,.error-card,.loading-card{border:1px solid #e5dce8;border-radius:18px;background:#fff}
.settings-card{padding:22px}
.status-card{background:linear-gradient(135deg,#fff 0%,#fbf7fd 100%)}
.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
.section-heading.simple{display:block}
.section-heading h3{font-size:1.22rem}
.switch-field{display:flex;align-items:center;gap:10px;font-weight:800;cursor:pointer}
.switch-field input{position:absolute;opacity:0;pointer-events:none}
.switch{position:relative;width:48px;height:26px;border-radius:999px;background:#d8d0dc;transition:.2s ease}
.switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 7px rgba(50,35,59,.2);transition:.2s ease}
.switch-field input:checked+.switch{background:#6e5084}
.switch-field input:checked+.switch::after{transform:translateX(22px)}
.public-url-row{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:20px;padding-top:18px;border-top:1px solid #ece4ee}
.public-url-row span,.public-url-row strong{display:block}
.public-url-row>div>span{color:#786f7c;font-size:.84rem}
.public-url-row strong{margin-top:5px;word-break:break-all}
.checkbox-field{display:flex;align-items:center;gap:9px;font-weight:750}
.checkbox-field input{width:18px;height:18px;accent-color:#6e5084}
.form-grid{display:grid;gap:17px;margin-top:20px}
.form-grid.two-column{grid-template-columns:repeat(2,minmax(0,1fr))}
.field{display:grid;gap:8px}
.field.full-width{grid-column:1/-1}
.field>span{font-size:.9rem;font-weight:800}
.field input,.field textarea{width:100%;border:1px solid #d9cedd;border-radius:12px;background:#fff;padding:12px 13px;color:#312837;font:inherit}
.field input{min-height:46px}
.field textarea{resize:vertical;line-height:1.55}
.field input:focus,.field textarea:focus{outline:3px solid rgba(110,80,132,.12);border-color:#6e5084}
.colour-input-row{display:grid;grid-template-columns:54px minmax(0,1fr);gap:10px}
.colour-input-row input[type="color"]{padding:4px}
.notice{padding:14px 16px;border-radius:12px;font-weight:750}
.notice.success{background:#e9f8f0;color:#246b46}
.notice.error{background:#fff0f2;color:#9d3645}
.form-actions{display:flex;justify-content:flex-end}
.error-card,.loading-card{padding:24px}
.error-card{border-color:#f0cbd0;background:#fffafb}
.error-card h2{margin:0 0 8px}
.error-card p:last-child{margin:0;color:#82414b}
.loading-line{height:13px;width:58%;margin-bottom:12px;border-radius:999px;background:linear-gradient(90deg,#f0eaf2,#faf8fb,#f0eaf2);background-size:200% 100%;animation:pulse 1.4s infinite}
.loading-line-wide{height:22px;width:34%}
.loading-line-short{width:42%;margin-bottom:0}
@keyframes pulse{to{background-position:-200% 0}}
@media(max-width:800px){.workspace-heading,.section-heading,.public-url-row{display:grid}.heading-actions{justify-self:start}.form-grid.two-column{grid-template-columns:1fr}.field.full-width{grid-column:auto}}
@media(max-width:560px){.settings-card{padding:17px}.form-actions{display:grid}.primary-button{width:100%}}
`;