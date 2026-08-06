"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { normaliseOrganisationWebsite } from "@/lib/url/organisationWebsite";
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

    const websiteResult = normaliseOrganisationWebsite(websiteUrl);

    if (!websiteResult.isValid) {
      setNotice({
        type: "error",
        message: "Check the website, image and social links before saving.",
      });
      return;
    }

    const canonicalWebsiteUrl = websiteResult.canonicalUrl;

    const urlValues = [logoUrl, heroImageUrl, linkedinUrl, facebookUrl, instagramUrl];

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
        website_url: canonicalWebsiteUrl,
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

  const profileCompletion = [
    displayName.trim(),
    careersHeading.trim(),
    careersIntro.trim(),
    aboutOrganisation.trim(),
    benefitsSummary.trim(),
    careersEmail.trim() || careersPhone.trim(),
  ].filter(Boolean).length;

  const profileCompletionPercent = Math.round((profileCompletion / 6) * 100);
  const brandingReady = Boolean(
    logoUrl.trim() ||
      heroImageUrl.trim() ||
      primaryColour !== "#6E5084" ||
      secondaryColour !== "#F7F1FC",
  );

  if (loading) {
    return (
      <section className="workspace careers-settings-workspace">
        <div className="skeleton heading" />
        <div className="summary-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="skeleton summary" key={index} />
          ))}
        </div>
        <div className="skeleton panel" />
        <style>{styles}</style>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="workspace careers-settings-workspace">
        <div className="state error" role="alert">
          <span aria-hidden="true">!</span>
          <h2>Careers settings could not be loaded</h2>
          <p>{pageError}</p>
        </div>
        <style>{styles}</style>
      </section>
    );
  }

  return (
    <section className="workspace careers-settings-workspace">
      <header className="workspace-heading">
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
              className="secondary"
            >
              Open public page
            </a>
          ) : null}
        </div>
      </header>

      <div className="summary-grid">
        <article>
          <span>Page status</span>
          <strong className={careersEnabled ? "live-value" : undefined}>
            {careersEnabled ? "Live" : "Hidden"}
          </strong>
          <small>
            {careersEnabled
              ? "The page is available to candidates"
              : "Enable the page when it is ready"}
          </small>
        </article>

        <article>
          <span>Profile completion</span>
          <strong>{profileCompletionPercent}%</strong>
          <small>{profileCompletion} of 6 core sections completed</small>
        </article>

        <article>
          <span>Branding</span>
          <strong>{brandingReady ? "Added" : "Default"}</strong>
          <small>
            {brandingReady
              ? "Organisation branding is configured"
              : "LEO colours are currently in use"}
          </small>
        </article>

        <article>
          <span>Public address</span>
          <strong className="address-value">
            {organisationSlug || "Not available"}
          </strong>
          <small>{publicPath || "A public address has not been generated"}</small>
        </article>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <section className="panel visibility-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Visibility</p>
              <h3>Public Careers page</h3>
              <p>
                Control whether candidates can access the public page and
                whether closed vacancies remain visible.
              </p>
            </div>
          </div>

          <div className="visibility-grid">
            <label className="setting-row">
              <div>
                <strong>Enable public Careers page</strong>
                <span>
                  Make the organisation&apos;s Careers page available to
                  candidates.
                </span>
              </div>

              <span className="switch-control">
                <input
                  type="checkbox"
                  checked={careersEnabled}
                  onChange={(event) => setCareersEnabled(event.target.checked)}
                  disabled={saving}
                />
                <span className="switch" aria-hidden="true" />
                <span className="switch-label">
                  {careersEnabled ? "Enabled" : "Disabled"}
                </span>
              </span>
            </label>

            <label className="setting-row">
              <div>
                <strong>Show closed vacancies</strong>
                <span>
                  Keep previously advertised roles visible after they close.
                </span>
              </div>

              <span className="switch-control">
                <input
                  type="checkbox"
                  checked={showClosedVacancies}
                  onChange={(event) =>
                    setShowClosedVacancies(event.target.checked)
                  }
                  disabled={saving}
                />
                <span className="switch" aria-hidden="true" />
                <span className="switch-label">
                  {showClosedVacancies ? "Shown" : "Hidden"}
                </span>
              </span>
            </label>
          </div>

          <div className="public-address">
            <div>
              <span>Public page address</span>
              <strong>{publicPath || "Not available"}</strong>
            </div>
            <small>
              This is generated from the organisation slug and cannot be
              changed here.
            </small>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Page content</p>
              <h3>Organisation introduction</h3>
              <p>
                Introduce your organisation and explain what candidates can
                expect from working with you.
              </p>
            </div>
          </div>

          <div className="form-grid two-column">
            <label className="field">
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

            <label className="field">
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
              <small>{careersIntro.length} / 1200 characters</small>
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
              <small>{aboutOrganisation.length} / 3000 characters</small>
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
              <small>{benefitsSummary.length} / 2500 characters</small>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Branding</p>
              <h3>Images and colours</h3>
              <p>
                Apply your organisation&apos;s visual identity to the public
                Careers page.
              </p>
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
              <small>Use a secure, publicly accessible image address.</small>
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
              <small>
                This image will appear at the top of the public Careers page.
              </small>
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

          <div className="colour-preview" aria-label="Brand colour preview">
            <div style={{ backgroundColor: primaryColour }}>
              <span>Primary</span>
              <strong>{primaryColour.toUpperCase()}</strong>
            </div>
            <div style={{ backgroundColor: secondaryColour }}>
              <span>Secondary</span>
              <strong>{secondaryColour.toUpperCase()}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Contact</p>
              <h3>Candidate contact details</h3>
              <p>
                Add the contact details candidates should use for Careers
                enquiries.
              </p>
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

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Social links</p>
              <h3>Organisation channels</h3>
              <p>
                Connect candidates with your organisation&apos;s official
                social channels.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
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

            <label className="field">
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

            <label className="field">
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
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Careers settings"}
          </button>
        </div>
      </form>

      <style>{styles}</style>
    </section>
  );
}

const styles = `.careers-settings-workspace {
  display: grid;
  gap: 24px;
  color: #2f2635;
}

.careers-settings-workspace *,
.careers-settings-workspace *::before,
.careers-settings-workspace *::after {
  box-sizing: border-box;
}

.careers-settings-workspace .workspace-heading,
.careers-settings-workspace .panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-start;
}

.careers-settings-workspace .workspace-heading {
  padding: 4px 2px 0;
}

.careers-settings-workspace .workspace-heading h2,
.careers-settings-workspace .panel-heading h3 {
  margin: 0;
  color: #2f2635;
  letter-spacing: -0.025em;
}

.careers-settings-workspace .workspace-heading h2 {
  font-size: clamp(1.65rem, 2vw, 2rem);
  line-height: 1.15;
}

.careers-settings-workspace .panel-heading h3 {
  font-size: 1.1rem;
  line-height: 1.3;
}

.careers-settings-workspace .workspace-heading p:not(.eyebrow),
.careers-settings-workspace .panel-heading p:not(.eyebrow) {
  margin: 9px 0 0;
  max-width: 760px;
  color: #716777;
  line-height: 1.65;
}

.careers-settings-workspace .eyebrow {
  margin: 0 0 8px;
  color: #6e5084;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.careers-settings-workspace .heading-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.careers-settings-workspace button,
.careers-settings-workspace input,
.careers-settings-workspace textarea {
  font: inherit;
}

.careers-settings-workspace .primary,
.careers-settings-workspace .secondary {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 17px;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
  cursor: pointer;
}

.careers-settings-workspace .primary {
  border: 1px solid #6e5084;
  background: #6e5084;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(110, 80, 132, 0.16);
}

.careers-settings-workspace .primary:hover:not(:disabled) {
  background: #624676;
  border-color: #624676;
  box-shadow: 0 10px 22px rgba(110, 80, 132, 0.22);
  transform: translateY(-1px);
}

.careers-settings-workspace .secondary {
  border: 1px solid #d9cbe2;
  background: #ffffff;
  color: #6e5084;
}

.careers-settings-workspace .secondary:hover {
  border-color: #bca2cd;
  background: #faf7fc;
  transform: translateY(-1px);
}

.careers-settings-workspace .primary:focus-visible,
.careers-settings-workspace .secondary:focus-visible,
.careers-settings-workspace input:focus-visible,
.careers-settings-workspace textarea:focus-visible {
  outline: 3px solid rgba(110, 80, 132, 0.18);
  outline-offset: 2px;
}

.careers-settings-workspace .primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.careers-settings-workspace .summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.careers-settings-workspace .summary-grid article {
  position: relative;
  min-height: 128px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid #e6ddea;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(75, 55, 84, 0.055);
}

.careers-settings-workspace .summary-grid article::after {
  position: absolute;
  top: -34px;
  right: -34px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: #f5eef9;
  content: "";
}

.careers-settings-workspace .summary-grid span,
.careers-settings-workspace .summary-grid small {
  position: relative;
  z-index: 1;
  display: block;
  color: #716777;
}

.careers-settings-workspace .summary-grid span {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.careers-settings-workspace .summary-grid strong {
  position: relative;
  z-index: 1;
  display: block;
  margin: 9px 0 5px;
  color: #34293a;
  font-size: 1.9rem;
  line-height: 1;
}

.careers-settings-workspace .summary-grid strong.live-value {
  color: #246b46;
}

.careers-settings-workspace .summary-grid strong.address-value {
  overflow: hidden;
  font-size: 1.15rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.careers-settings-workspace .summary-grid small {
  font-size: 0.84rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.careers-settings-workspace .settings-form {
  display: grid;
  gap: 18px;
}

.careers-settings-workspace .panel {
  padding: 22px;
  border: 1px solid #e6ddea;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(75, 55, 84, 0.055);
}

.careers-settings-workspace .visibility-panel {
  border-color: #ddcfe6;
  background:
    linear-gradient(135deg, rgba(247, 241, 252, 0.9), rgba(255, 255, 255, 0.98));
}

.careers-settings-workspace .visibility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.careers-settings-workspace .setting-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 17px;
  border: 1px solid #e6ddea;
  border-radius: 16px;
  background: #ffffff;
  cursor: pointer;
}

.careers-settings-workspace .setting-row strong,
.careers-settings-workspace .setting-row span {
  display: block;
}

.careers-settings-workspace .setting-row strong {
  color: #34293a;
  font-size: 0.94rem;
}

.careers-settings-workspace .setting-row > div > span {
  margin-top: 5px;
  color: #786e7c;
  font-size: 0.84rem;
  line-height: 1.45;
}

.careers-settings-workspace .switch-control {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
}

.careers-settings-workspace .switch-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.careers-settings-workspace .switch {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 999px;
  background: #d8d0dc;
  transition: 0.2s ease;
}

.careers-settings-workspace .switch::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 7px rgba(50, 35, 59, 0.2);
  transition: 0.2s ease;
  content: "";
}

.careers-settings-workspace .switch-control input:checked + .switch {
  background: #6e5084;
}

.careers-settings-workspace .switch-control input:checked + .switch::after {
  transform: translateX(22px);
}

.careers-settings-workspace .switch-label {
  min-width: 62px;
  color: #5f5364;
  font-size: 0.8rem;
  font-weight: 800;
}

.careers-settings-workspace .public-address {
  display: flex;
  justify-content: space-between;
  gap: 22px;
  align-items: center;
  margin-top: 14px;
  padding: 16px;
  border: 1px dashed #d7c9df;
  border-radius: 16px;
  background: #fcfafc;
}

.careers-settings-workspace .public-address span,
.careers-settings-workspace .public-address strong {
  display: block;
}

.careers-settings-workspace .public-address span {
  color: #716777;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.careers-settings-workspace .public-address strong {
  margin-top: 5px;
  color: #6e5084;
  overflow-wrap: anywhere;
}

.careers-settings-workspace .public-address small {
  max-width: 380px;
  color: #7b7080;
  line-height: 1.45;
  text-align: right;
}

.careers-settings-workspace .form-grid {
  display: grid;
  gap: 17px;
  margin-top: 20px;
}

.careers-settings-workspace .form-grid.two-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.careers-settings-workspace .field {
  display: grid;
  gap: 8px;
}

.careers-settings-workspace .field.full-width {
  grid-column: 1 / -1;
}

.careers-settings-workspace .field > span {
  color: #4b3f50;
  font-size: 0.84rem;
  font-weight: 800;
}

.careers-settings-workspace .field input,
.careers-settings-workspace .field textarea {
  width: 100%;
  border: 1px solid #d9cfdd;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px 13px;
  color: #332a37;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.careers-settings-workspace .field input {
  min-height: 44px;
}

.careers-settings-workspace .field textarea {
  resize: vertical;
  line-height: 1.55;
}

.careers-settings-workspace .field input:hover:not(:disabled),
.careers-settings-workspace .field textarea:hover:not(:disabled) {
  border-color: #c5b4ce;
}

.careers-settings-workspace .field input:focus,
.careers-settings-workspace .field textarea:focus {
  border-color: #8a6b9f;
  box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.1);
  outline: none;
}

.careers-settings-workspace .field input:disabled,
.careers-settings-workspace .field textarea:disabled {
  background: #f7f4f8;
  color: #837a86;
}

.careers-settings-workspace .field small {
  color: #817584;
  font-size: 0.78rem;
  line-height: 1.4;
}

.careers-settings-workspace .colour-input-row {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px;
}

.careers-settings-workspace .colour-input-row input[type="color"] {
  padding: 4px;
}

.careers-settings-workspace .colour-preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.careers-settings-workspace .colour-preview > div {
  min-height: 82px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding: 14px;
  border: 1px solid rgba(47, 38, 53, 0.12);
  border-radius: 15px;
  color: #2f2635;
}

.careers-settings-workspace .colour-preview span,
.careers-settings-workspace .colour-preview strong {
  padding: 4px 7px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(4px);
}

.careers-settings-workspace .colour-preview span {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.careers-settings-workspace .colour-preview strong {
  font-size: 0.82rem;
}

.careers-settings-workspace .notice {
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 14px;
  font-weight: 750;
  line-height: 1.5;
}

.careers-settings-workspace .notice.success {
  border-color: #cfe9da;
  background: #eef9f3;
  color: #246b46;
}

.careers-settings-workspace .notice.error {
  border-color: #f1d0d6;
  background: #fff3f5;
  color: #963746;
}

.careers-settings-workspace .form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.careers-settings-workspace .state {
  padding: 48px 26px;
  border: 1px dashed #d9cfdd;
  border-radius: 20px;
  background: #fcfafc;
  text-align: center;
}

.careers-settings-workspace .state > span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #f0e7f5;
  color: #6e5084;
  font-weight: 900;
}

.careers-settings-workspace .state h2 {
  margin: 0 0 8px;
}

.careers-settings-workspace .state p {
  margin: 0 auto;
  max-width: 650px;
  color: #746a78;
  line-height: 1.6;
}

.careers-settings-workspace .state.error > span {
  background: #fff0f2;
  color: #9d3645;
}

.careers-settings-workspace .skeleton {
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    #f3eef5 25%,
    #faf8fb 50%,
    #f3eef5 75%
  );
  background-size: 200% 100%;
  animation: careersSettingsPulse 1.4s infinite;
}

.careers-settings-workspace .skeleton.heading {
  width: min(70%, 720px);
  height: 78px;
}

.careers-settings-workspace .skeleton.summary {
  height: 128px;
}

.careers-settings-workspace .skeleton.panel {
  height: 340px;
}

@keyframes careersSettingsPulse {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 980px) {
  .careers-settings-workspace .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .careers-settings-workspace .visibility-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .careers-settings-workspace .workspace-heading,
  .careers-settings-workspace .panel-heading,
  .careers-settings-workspace .public-address {
    display: grid;
  }

  .careers-settings-workspace .heading-actions {
    justify-content: flex-start;
  }

  .careers-settings-workspace .public-address small {
    max-width: none;
    text-align: left;
  }

  .careers-settings-workspace .form-grid.two-column,
  .careers-settings-workspace .colour-preview {
    grid-template-columns: 1fr;
  }

  .careers-settings-workspace .field.full-width {
    grid-column: auto;
  }
}

@media (max-width: 560px) {
  .careers-settings-workspace {
    gap: 18px;
  }

  .careers-settings-workspace .panel {
    padding: 18px;
    border-radius: 17px;
  }

  .careers-settings-workspace .summary-grid {
    grid-template-columns: 1fr;
  }

  .careers-settings-workspace .heading-actions,
  .careers-settings-workspace .heading-actions .secondary,
  .careers-settings-workspace .form-actions,
  .careers-settings-workspace .form-actions .primary {
    width: 100%;
  }

  .careers-settings-workspace .setting-row {
    display: grid;
  }

  .careers-settings-workspace .switch-control {
    justify-content: space-between;
  }
}
`;