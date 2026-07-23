"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PeopleAccessWorkspace from "./components/PeopleAccessWorkspace";
import SecurityWorkspace from "./components/SecurityWorkspace";
import AuditWorkspace from "./components/AuditWorkspace";
import SubscriptionBillingWorkspace from "./components/SubscriptionBillingWorkspace";
import CareersWorkspace from "./components/CareersWorkspace";

type OrganisationRecord = {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
  employee_count_band: string | null;
  status: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
};

type OrganisationWorkspace =
  | "overview"
  | "careers"
  | "billing"
  | "people"
  | "security"
  | "audit";

type Notice =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const workspaceOptions: Array<{
  key: OrganisationWorkspace;
  label: string;
}> = [
  { key: "overview", label: "Overview" },
  { key: "careers", label: "Careers" },
  { key: "billing", label: "Subscription & Billing" },
  { key: "people", label: "People & Access" },
  { key: "security", label: "Security" },
  { key: "audit", label: "Audit" },
];

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEmployeeBand(value: string | null) {
  const labels: Record<string, string> = {
    trial: "Free 7-day trial",
    up_to_50: "Up to 50 employees",
    up_to_150: "Up to 150 employees",
    up_to_250: "Up to 250 employees",
    over_250: "Over 250 employees",
  };

  if (!value) return "Not available";

  return (
    labels[value] ??
    value.replaceAll("_", " ").replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
  );
}

function formatStatus(value: string | null) {
  if (!value) return "Not available";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normaliseWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function OrganisationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [activeWorkspace, setActiveWorkspace] =
    useState<OrganisationWorkspace>("overview");
  const [organisation, setOrganisation] =
    useState<OrganisationRecord | null>(null);
  const [organisationName, setOrganisationName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganisation() {
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
            "Your organisation could not be loaded because you are not signed in.",
        );
        setLoading(false);
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organisation_memberships")
        .select("organisation_id, is_default_organisation, created_at")
        .eq("user_id", user.id)
        .eq("membership_status", "active")
        .order("is_default_organisation", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (membershipError) {
        setPageError(membershipError.message);
        setLoading(false);
        return;
      }

      if (!membership?.organisation_id) {
        setPageError("No active organisation is linked to your account.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("organisations")
        .select(
          "id, name, slug, website_url, employee_count_band, status, trial_started_at, trial_ends_at, created_at",
        )
        .eq("id", membership.organisation_id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setPageError(
          error?.message || "The organisation record could not be found.",
        );
        setLoading(false);
        return;
      }

      const record = data as OrganisationRecord;

      setOrganisation(record);
      setOrganisationName(record.name ?? "");
      setWebsiteUrl(record.website_url ?? "");
      setLoading(false);
    }

    void loadOrganisation();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organisation) return;

    const trimmedName = organisationName.trim();

    if (!trimmedName) {
      setNotice({
        type: "error",
        message: "Enter the organisation name before saving.",
      });
      return;
    }

    const normalisedWebsite = normaliseWebsite(websiteUrl);

    if (normalisedWebsite) {
      try {
        new URL(normalisedWebsite);
      } catch {
        setNotice({
          type: "error",
          message: "Enter a valid website address.",
        });
        return;
      }
    }

    setSaving(true);
    setNotice(null);

    const { data, error } = await supabase
      .from("organisations")
      .update({
        name: trimmedName,
        website_url: normalisedWebsite,
      })
      .eq("id", organisation.id)
      .select(
        "id, name, slug, website_url, employee_count_band, status, trial_started_at, trial_ends_at, created_at",
      )
      .single();

    if (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
      setSaving(false);
      return;
    }

    const updated = data as OrganisationRecord;

    setOrganisation(updated);
    setOrganisationName(updated.name ?? "");
    setWebsiteUrl(updated.website_url ?? "");
    setNotice({
      type: "success",
      message: "Organisation details have been updated.",
    });
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="organisation-page">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Organisation</p>
            <h1>Organisation</h1>
            <p>Loading your organisation details.</p>
          </div>
        </header>

        <section className="loading-card" aria-live="polite">
          <div className="loading-line loading-line-wide" />
          <div className="loading-line" />
          <div className="loading-line loading-line-short" />
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="organisation-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1>Organisation</h1>
          <p>
            Manage your organisation account, people and access, security
            posture and administration history.
          </p>
        </div>

        <Link href="/dashboard/foundations" className="secondary-link">
          Open Foundations
        </Link>
      </header>

      <nav className="organisation-navigation" aria-label="Organisation">
        {workspaceOptions.map((workspace) => (
          <button
            key={workspace.key}
            type="button"
            className={
              activeWorkspace === workspace.key
                ? "organisation-nav-button active"
                : "organisation-nav-button"
            }
            aria-current={
              activeWorkspace === workspace.key ? "page" : undefined
            }
            onClick={() => {
              setNotice(null);
              setActiveWorkspace(workspace.key);
            }}
          >
            {workspace.label}
          </button>
        ))}
      </nav>

      {pageError ? (
        <section className="error-card" role="alert">
          <p className="card-eyebrow">Unable to load</p>
          <h2>Organisation details are unavailable</h2>
          <p>{pageError}</p>
        </section>
      ) : null}

      {!pageError && organisation && activeWorkspace === "overview" ? (
        <div className="organisation-grid">
          <section className="organisation-card">
            <div className="card-heading">
              <p className="card-eyebrow">Organisation details</p>
              <h2>Account information</h2>
              <p>
                Update the organisation name and website used across the LEO
                platform.
              </p>
            </div>

            <form className="form-stack" onSubmit={handleSave}>
              <label className="field">
                <span>Organisation name</span>
                <input
                  type="text"
                  value={organisationName}
                  onChange={(event) => setOrganisationName(event.target.value)}
                  maxLength={180}
                  autoComplete="organization"
                  disabled={saving}
                  required
                />
              </label>

              <label className="field">
                <span>Website</span>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://www.example.co.uk"
                  inputMode="url"
                  autoComplete="url"
                  maxLength={300}
                  disabled={saving}
                />
                <small>
                  Leave blank where the organisation does not have a website.
                </small>
              </label>

              <label className="field">
                <span>Organisation slug</span>
                <input type="text" value={organisation.slug ?? ""} disabled />
                <small>
                  This reference is generated by LEO and cannot be edited here.
                </small>
              </label>

              {notice ? (
                <div
                  className={`inline-notice ${notice.type}`}
                  role={notice.type === "error" ? "alert" : "status"}
                >
                  {notice.message}
                </div>
              ) : null}

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save organisation details"}
                </button>
              </div>
            </form>
          </section>

          <section className="organisation-card">
            <div className="card-heading">
              <p className="card-eyebrow">Platform account</p>
              <h2>Current status</h2>
              <p>
                A summary of the organisation&apos;s current LEO account
                position.
              </p>
            </div>

            <dl className="status-list">
              <div className="status-row">
                <dt>Account status</dt>
                <dd>
                  <span
                    className={`status-pill ${
                      organisation.status === "active"
                        ? "success"
                        : organisation.status === "trial"
                          ? "trial"
                          : "neutral"
                    }`}
                  >
                    {formatStatus(organisation.status)}
                  </span>
                </dd>
              </div>

              <div className="status-row">
                <dt>Organisation size</dt>
                <dd>{formatEmployeeBand(organisation.employee_count_band)}</dd>
              </div>

              <div className="status-row">
                <dt>Account created</dt>
                <dd>{formatDate(organisation.created_at)}</dd>
              </div>

              {organisation.trial_started_at ? (
                <div className="status-row">
                  <dt>Trial started</dt>
                  <dd>{formatDate(organisation.trial_started_at)}</dd>
                </div>
              ) : null}

              {organisation.trial_ends_at ? (
                <div className="status-row">
                  <dt>Trial ends</dt>
                  <dd>{formatDate(organisation.trial_ends_at)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="organisation-card organisation-card-wide">
            <div className="card-heading">
              <p className="card-eyebrow">Business context</p>
              <h2>Foundations and organisation memory</h2>
              <p>
                Detailed business structure, working arrangements, policies and
                operational context are managed through Foundations.
              </p>
            </div>

            <div className="foundation-grid">
              <Link
                href="/dashboard/foundations/company-profile"
                className="foundation-link"
              >
                <span>Company Profile</span>
                <small>Core business identity and operating context</small>
              </Link>

              <Link
                href="/dashboard/foundations/employment-framework"
                className="foundation-link"
              >
                <span>Employment Framework</span>
                <small>Working arrangements and employment practices</small>
              </Link>

              <Link
                href="/dashboard/foundations/organisation-structure"
                className="foundation-link"
              >
                <span>Organisation Structure</span>
                <small>Teams, reporting lines and management structure</small>
              </Link>

              <Link
                href="/dashboard/foundations/company-knowledge"
                className="foundation-link"
              >
                <span>Company Knowledge</span>
                <small>Operational knowledge used throughout LEO</small>
              </Link>
            </div>
          </section>
        </div>
      ) : null}


      {!pageError && organisation && activeWorkspace === "careers" ? (
        <section className="workspace-panel">
          <CareersWorkspace organisationId={organisation.id} />
        </section>
      ) : null}

      {!pageError && organisation && activeWorkspace === "billing" ? (
        <div className="billing-workspace-container">
          <SubscriptionBillingWorkspace organisationId={organisation.id} />
        </div>
      ) : null}

      {!pageError && organisation && activeWorkspace === "people" ? (
        <section className="workspace-panel">
          <PeopleAccessWorkspace organisationId={organisation.id} />
        </section>
      ) : null}

      {!pageError && organisation && activeWorkspace === "security" ? (
        <section className="workspace-panel">
          <SecurityWorkspace organisationId={organisation.id} />
        </section>
      ) : null}

      {!pageError && organisation && activeWorkspace === "audit" ? (
        <section className="workspace-panel">
          <AuditWorkspace organisationId={organisation.id} />
        </section>
      ) : null}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.organisation-page{width:100%;max-width:1440px;margin:0 auto;padding:8px 4px 40px;color:#2f2635}
.page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:24px}
.eyebrow,.card-eyebrow{margin:0 0 8px;color:#6e5084;font-size:.76rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
h1,h2,p{margin-top:0}
h1{margin-bottom:8px;color:#2d2332;font-size:clamp(2rem,4vw,3rem);line-height:1.08;letter-spacing:-.035em}
.page-heading p:not(.eyebrow){max-width:760px;margin-bottom:0;color:#6d6371;font-size:1rem;line-height:1.65}
.secondary-link{flex:0 0 auto;min-height:44px;display:inline-flex;align-items:center;padding:0 17px;border:1px solid #cdb2e2;border-radius:12px;background:#fff;color:#6e5084;font-weight:800;text-decoration:none}
.organisation-navigation{display:flex;gap:8px;overflow:auto;margin-bottom:22px;padding:6px;border:1px solid #e4dbe7;border-radius:16px;background:#fff}
.organisation-nav-button{flex:0 0 auto;padding:10px 15px;border:0;border-radius:11px;background:transparent;color:#6f6573;font:inherit;font-weight:750;cursor:pointer}
.organisation-nav-button:hover{background:#faf7fb;color:#6e5084}
.organisation-nav-button.active{background:#6e5084;color:#fff}
.organisation-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:18px}
.organisation-card,.workspace-panel,.error-card,.loading-card{border:1px solid #e5dce8;border-radius:20px;background:#fff;box-shadow:0 12px 34px rgba(70,51,79,.06)}
.organisation-card{padding:24px}
.organisation-card-wide{grid-column:1/-1}
.workspace-panel{padding:24px}
.billing-workspace-container{min-width:0}
.card-heading h2{margin-bottom:8px;font-size:1.35rem}
.card-heading p:not(.card-eyebrow){margin-bottom:0;color:#746a78;line-height:1.6}
.form-stack{display:grid;gap:18px;margin-top:24px}
.field{display:grid;gap:8px}
.field>span{font-size:.9rem;font-weight:800}
.field input{width:100%;min-height:46px;border:1px solid #d9cedd;border-radius:12px;background:#fff;padding:0 13px;color:#312837;font:inherit}
.field input:focus{outline:3px solid rgba(110,80,132,.12);border-color:#6e5084}
.field input:disabled{background:#f7f4f8;color:#837a86}
.field small{color:#7a707e;line-height:1.45}
.form-actions{display:flex;justify-content:flex-end}
.primary-button{min-height:46px;padding:0 18px;border:0;border-radius:12px;background:#6e5084;color:#fff;font-weight:800;cursor:pointer}
.primary-button:disabled{opacity:.6;cursor:not-allowed}
.inline-notice{padding:13px 15px;border-radius:12px;font-weight:700}
.inline-notice.success{background:#e9f8f0;color:#246b46}
.inline-notice.error{background:#fff0f2;color:#9d3645}
.status-list{margin:20px 0 0}
.status-row{display:flex;justify-content:space-between;gap:24px;padding:14px 0;border-bottom:1px solid #eee8f0}
.status-row:last-child{border-bottom:0}
.status-row dt{color:#786e7c}
.status-row dd{margin:0;text-align:right;font-weight:800}
.status-pill{display:inline-flex;padding:6px 10px;border-radius:999px;font-size:.76rem}
.status-pill.success{background:#e7f7ee;color:#246b46}
.status-pill.trial{background:#f0e8f5;color:#6e5084}
.status-pill.neutral{background:#f0edf1;color:#6d6570}
.foundation-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}
.foundation-link{padding:16px;border:1px solid #e7ddea;border-radius:15px;background:#fcfafc;color:#332a37;text-decoration:none}
.foundation-link:hover{border-color:#cdb2e2;background:#f8f3fb}
.foundation-link span,.foundation-link small{display:block}
.foundation-link span{font-weight:850}
.foundation-link small{margin-top:6px;color:#776c7b;line-height:1.45}
.error-card,.loading-card{padding:26px}
.error-card{border-color:#f0cbd0;background:#fffafb}
.error-card h2{margin-bottom:8px}
.error-card p:last-child{margin-bottom:0;color:#82414b}
.loading-line{height:13px;width:58%;margin-bottom:12px;border-radius:999px;background:linear-gradient(90deg,#f0eaf2,#faf8fb,#f0eaf2);background-size:200% 100%;animation:pulse 1.4s infinite}
.loading-line-wide{height:22px;width:34%}
.loading-line-short{width:42%;margin-bottom:0}
@keyframes pulse{to{background-position:-200% 0}}
@media(max-width:980px){.organisation-grid{grid-template-columns:1fr}.foundation-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.page-heading{display:grid}.secondary-link{width:max-content}.workspace-panel{padding:17px}}
@media(max-width:520px){.foundation-grid{grid-template-columns:1fr}.organisation-card{padding:18px}}
`;