"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type PublicVacancy = {
  organisation_id: string;
  organisation_slug: string;
  organisation_name: string;
  logo_url: string | null;
  website_url: string | null;
  careers_email: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  vacancy_id: string;
  vacancy_reference: string;
  vacancy_slug: string;
  title: string;
  department: string | null;
  business_area: string | null;
  location_name: string | null;
  employment_type: string | null;
  work_pattern: string | null;
  hours_per_week: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  salary_currency: string | null;
  salary_visible: boolean;
  number_of_positions: number | null;
  role_summary: string | null;
  advert_text: string | null;
  responsibilities: string | null;
  essential_criteria: string | null;
  desirable_criteria: string | null;
  benefits: string | null;
  opening_date: string | null;
  closing_date: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normaliseVacancy(row: any): PublicVacancy {
  return {
    organisation_id: text(row.organisation_id),
    organisation_slug: text(row.organisation_slug),
    organisation_name: text(row.organisation_name) || "Organisation",
    logo_url: text(row.logo_url) || null,
    website_url: text(row.website_url) || null,
    careers_email: text(row.careers_email) || null,
    primary_colour: text(row.primary_colour) || null,
    secondary_colour: text(row.secondary_colour) || null,
    vacancy_id: text(row.vacancy_id),
    vacancy_reference: text(row.vacancy_reference),
    vacancy_slug: text(row.vacancy_slug),
    title: text(row.title) || "Untitled vacancy",
    department: text(row.department) || null,
    business_area: text(row.business_area) || null,
    location_name: text(row.location_name) || null,
    employment_type: text(row.employment_type) || null,
    work_pattern: text(row.work_pattern) || null,
    hours_per_week: numberOrNull(row.hours_per_week),
    salary_min: numberOrNull(row.salary_min),
    salary_max: numberOrNull(row.salary_max),
    salary_period: text(row.salary_period) || null,
    salary_currency: text(row.salary_currency) || "GBP",
    salary_visible: row.salary_visible !== false,
    number_of_positions: numberOrNull(row.number_of_positions),
    role_summary: text(row.role_summary) || null,
    advert_text: text(row.advert_text) || null,
    responsibilities: text(row.responsibilities) || null,
    essential_criteria: text(row.essential_criteria) || null,
    desirable_criteria: text(row.desirable_criteria) || null,
    benefits: text(row.benefits) || null,
    opening_date: text(row.opening_date) || null,
    closing_date: text(row.closing_date) || null,
    published_at: text(row.published_at) || null,
    metadata: objectOrEmpty(row.metadata),
  };
}

function formatEmploymentType(value: string | null): string {
  if (!value) return "Not stated";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "Open until filled";

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatSalary(vacancy: PublicVacancy): string {
  if (
    !vacancy.salary_visible ||
    (vacancy.salary_min === null && vacancy.salary_max === null)
  ) {
    return "Salary available on request";
  }

  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: vacancy.salary_currency || "GBP",
    maximumFractionDigits: 0,
  });

  if (
    vacancy.salary_min !== null &&
    vacancy.salary_max !== null &&
    vacancy.salary_min !== vacancy.salary_max
  ) {
    return `${formatter.format(vacancy.salary_min)}–${formatter.format(
      vacancy.salary_max,
    )} ${vacancy.salary_period || ""}`.trim();
  }

  const salary = vacancy.salary_min ?? vacancy.salary_max;

  return salary === null
    ? "Salary available on request"
    : `${formatter.format(salary)} ${vacancy.salary_period || ""}`.trim();
}

function metadataBoolean(
  metadata: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some((key) => metadata[key] === true);
}

function sectionLines(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function ContentSection({
  eyebrow,
  title,
  content,
  list,
}: {
  eyebrow: string;
  title: string;
  content: string | null;
  list?: boolean;
}) {
  if (!content) return null;

  const lines = sectionLines(content);

  return (
    <section className="contentCard">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>

      {list && lines.length > 1 ? (
        <ul className="contentList">
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="longText">{content}</p>
      )}
    </section>
  );
}

export default function PublicVacancyPage() {
  const params = useParams<{
    organisationSlug: string;
    vacancySlug: string;
  }>();

  const organisationSlug = decodeURIComponent(params.organisationSlug || "");
  const vacancySlug = decodeURIComponent(params.vacancySlug || "");

  const [vacancy, setVacancy] = useState<PublicVacancy | null>(null);
  const [similarVacancies, setSimilarVacancies] = useState<PublicVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const loadVacancy = useCallback(async () => {
    if (!organisationSlug || !vacancySlug) return;

    setLoading(true);
    setPageError("");
    setNotFound(false);

    const { data, error } = await supabase
      .from("leo_public_careers_vacancies")
      .select("*")
      .eq("organisation_slug", organisationSlug)
      .eq("vacancy_slug", vacancySlug)
      .maybeSingle();

    if (error) {
      console.error("Public vacancy could not be loaded:", error);
      setPageError(
        "This vacancy could not be loaded. Please try again shortly.",
      );
      setLoading(false);
      return;
    }

    if (!data) {
      setVacancy(null);
      setSimilarVacancies([]);
      setNotFound(true);
      setLoading(false);
      return;
    }

    const normalised = normaliseVacancy(data);
    setVacancy(normalised);

    const { data: similarData, error: similarError } = await supabase
      .from("leo_public_careers_vacancies")
      .select("*")
      .eq("organisation_slug", organisationSlug)
      .neq("vacancy_id", normalised.vacancy_id)
      .order("published_at", { ascending: false })
      .limit(3);

    if (similarError) {
      console.error("Similar vacancies could not be loaded:", similarError);
      setSimilarVacancies([]);
    } else {
      setSimilarVacancies(
        (similarData ?? []).map((row: any) => normaliseVacancy(row)),
      );
    }

    setLoading(false);
  }, [organisationSlug, vacancySlug]);

  useEffect(() => {
    void loadVacancy();
  }, [loadVacancy]);

  const saferRecruitmentRequired = useMemo(() => {
    if (!vacancy) return false;

    return metadataBoolean(vacancy.metadata, [
      "safer_recruitment_required",
      "due_diligence_required",
      "dbs_required",
      "regulated_role",
    ]);
  }, [vacancy]);

  const applyHref = vacancy
    ? `/careers/${encodeURIComponent(
        vacancy.organisation_slug,
      )}/${encodeURIComponent(vacancy.vacancy_slug)}/apply`
    : "#";

  if (loading) {
    return (
      <main className="pageState">
        <span className="spinner" aria-hidden="true" />
        <h1>Loading vacancy…</h1>
        <p>LEO is retrieving the current role information.</p>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="pageState">
        <span className="stateIcon errorIcon" aria-hidden="true">
          !
        </span>
        <h1>Vacancy unavailable</h1>
        <p>{pageError}</p>
        <button
          type="button"
          className="primaryButton"
          onClick={() => void loadVacancy()}
        >
          Try again
        </button>
        <Link href="/careers" className="textLink">
          Return to all opportunities
        </Link>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  if (notFound || !vacancy) {
    return (
      <main className="pageState">
        <span className="stateIcon" aria-hidden="true">
          ✦
        </span>
        <h1>Vacancy not found</h1>
        <p>
          This vacancy may have closed, been withdrawn or is no longer publicly
          available.
        </p>
        <Link
          href={`/careers/${encodeURIComponent(organisationSlug)}`}
          className="primaryButton"
        >
          View organisation vacancies
        </Link>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  return (
    <main className="vacancyPage">
      <header className="siteHeader">
        <Link href="/careers" className="brandLink" aria-label="LEO Careers">
          <span className="brandMark" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>LEO</strong>
            <small>Careers</small>
          </span>
        </Link>

        <Link
          href={`/careers/${encodeURIComponent(vacancy.organisation_slug)}`}
          className="headerLink"
        >
          All {vacancy.organisation_name} vacancies
        </Link>
      </header>

      <section className="vacancyHero">
        <div className="breadcrumbs">
          <Link href="/careers">Careers</Link>
          <span>/</span>
          <Link
            href={`/careers/${encodeURIComponent(
              vacancy.organisation_slug,
            )}`}
          >
            {vacancy.organisation_name}
          </Link>
          <span>/</span>
          <span>{vacancy.title}</span>
        </div>

        <div className="heroGrid">
          <div className="heroMain">
            <div className="organisationLine">
              {vacancy.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vacancy.logo_url}
                  alt={`${vacancy.organisation_name} logo`}
                  className="organisationLogo"
                />
              ) : (
                <span className="organisationInitial" aria-hidden="true">
                  {vacancy.organisation_name.charAt(0).toUpperCase()}
                </span>
              )}

              <div>
                <p className="eyebrow">{vacancy.vacancy_reference}</p>
                <p className="organisationName">
                  {vacancy.organisation_name}
                </p>
              </div>
            </div>

            <h1>{vacancy.title}</h1>

            <p className="heroSummary">
              {vacancy.role_summary ||
                "Review the full vacancy information below before beginning your application."}
            </p>

            <div className="heroActions">
              <Link href={applyHref} className="primaryButton">
                Apply for this vacancy
              </Link>

              <Link
                href={`/careers/${encodeURIComponent(
                  vacancy.organisation_slug,
                )}`}
                className="secondaryButton"
              >
                View employer profile
              </Link>
            </div>
          </div>

          <aside className="summaryCard">
            <p className="eyebrow">VACANCY SUMMARY</p>

            <dl>
              <div>
                <dt>Location</dt>
                <dd>{vacancy.location_name || "Not stated"}</dd>
              </div>
              <div>
                <dt>Employment type</dt>
                <dd>{formatEmploymentType(vacancy.employment_type)}</dd>
              </div>
              <div>
                <dt>Working pattern</dt>
                <dd>{vacancy.work_pattern || "Not stated"}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>
                  {vacancy.hours_per_week !== null
                    ? `${vacancy.hours_per_week} hours per week`
                    : "Not stated"}
                </dd>
              </div>
              <div>
                <dt>Salary</dt>
                <dd>{formatSalary(vacancy)}</dd>
              </div>
              <div>
                <dt>Closing date</dt>
                <dd>{formatDate(vacancy.closing_date)}</dd>
              </div>
              {vacancy.number_of_positions &&
              vacancy.number_of_positions > 1 ? (
                <div>
                  <dt>Positions available</dt>
                  <dd>{vacancy.number_of_positions}</dd>
                </div>
              ) : null}
            </dl>

            <Link href={applyHref} className="primaryButton fullButton">
              Start application
            </Link>
          </aside>
        </div>
      </section>

      <section className="pageGrid">
        <div className="mainContent">
          <ContentSection
            eyebrow="ABOUT THE ROLE"
            title="The opportunity"
            content={vacancy.advert_text || vacancy.role_summary}
          />

          <ContentSection
            eyebrow="WHAT YOU WILL DO"
            title="Responsibilities"
            content={vacancy.responsibilities}
            list
          />

          <ContentSection
            eyebrow="WHAT WE ARE LOOKING FOR"
            title="Essential criteria"
            content={vacancy.essential_criteria}
            list
          />

          <ContentSection
            eyebrow="ADDITIONAL EXPERIENCE"
            title="Desirable criteria"
            content={vacancy.desirable_criteria}
            list
          />

          <ContentSection
            eyebrow="WORKING HERE"
            title="Benefits"
            content={vacancy.benefits}
            list
          />

          {saferRecruitmentRequired ? (
            <section className="noticeCard">
              <div className="noticeIcon" aria-hidden="true">
                ✓
              </div>
              <div>
                <p className="eyebrow">SAFER RECRUITMENT</p>
                <h2>Pre-employment checks apply to this role</h2>
                <p>
                  The successful candidate may be required to complete
                  role-appropriate checks. These may include identity and right
                  to work checks, references, DBS checks, overseas checks or
                  verification of professional registrations where applicable.
                  Any health information will only be requested at the
                  appropriate post-offer stage.
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="sideColumn">
          <section className="applyCard">
            <p className="eyebrow">READY TO APPLY?</p>
            <h2>Start your application</h2>
            <p>
              Review the role information carefully before submitting your
              details.
            </p>

            <Link href={applyHref} className="primaryButton fullButton">
              Apply now
            </Link>

            <p className="smallPrint">
              Your application will be submitted directly to{" "}
              {vacancy.organisation_name}.
            </p>
          </section>

          <section className="employerCard">
            <p className="eyebrow">THE EMPLOYER</p>
            <h2>{vacancy.organisation_name}</h2>

            {vacancy.department || vacancy.business_area ? (
              <p>
                {vacancy.department ||
                  vacancy.business_area ||
                  "Organisation-wide"}
              </p>
            ) : null}

            <Link
              href={`/careers/${encodeURIComponent(
                vacancy.organisation_slug,
              )}`}
              className="secondaryButton fullButton"
            >
              View careers profile
            </Link>

            {vacancy.website_url ? (
              <a
                href={vacancy.website_url}
                target="_blank"
                rel="noreferrer"
                className="textLink"
              >
                Visit organisation website
              </a>
            ) : null}

            {vacancy.careers_email ? (
              <a
                href={`mailto:${vacancy.careers_email}`}
                className="textLink"
              >
                Contact the careers team
              </a>
            ) : null}
          </section>
        </aside>
      </section>

      {similarVacancies.length > 0 ? (
        <section className="similarSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">MORE OPPORTUNITIES</p>
              <h2>Other vacancies with {vacancy.organisation_name}</h2>
            </div>

            <Link
              href={`/careers/${encodeURIComponent(
                vacancy.organisation_slug,
              )}`}
              className="headerLink"
            >
              View all vacancies
            </Link>
          </div>

          <div className="similarGrid">
            {similarVacancies.map((item) => (
              <article key={item.vacancy_id} className="similarCard">
                <p>{item.vacancy_reference}</p>
                <h3>{item.title}</h3>
                <div className="similarMeta">
                  <span>{item.location_name || "Location not stated"}</span>
                  <span>{formatEmploymentType(item.employment_type)}</span>
                </div>
                <p className="similarSummary">
                  {item.role_summary ||
                    "Open the vacancy to review the full role information."}
                </p>
                <Link
                  href={`/careers/${encodeURIComponent(
                    item.organisation_slug,
                  )}/${encodeURIComponent(item.vacancy_slug)}`}
                  className="secondaryButton fullButton"
                >
                  View vacancy
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="candidateNotice">
        <div>
          <p className="eyebrow">CANDIDATE INFORMATION</p>
          <h2>A clear and structured recruitment process.</h2>
        </div>
        <p>
          Vacancy information and recruitment decisions are provided and made by{" "}
          {vacancy.organisation_name}. LEO supports the organisation to manage
          the process consistently.
        </p>
      </section>

      <footer className="siteFooter">
        <span>Powered by LEO Careers</span>
        <span>Employment intelligence for employers in England &amp; Wales.</span>
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
          background: #ffffff;
        }

        :global(body) {
          margin: 0;
          background: #ffffff;
          color: #20262a;
        }

        .vacancyPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 94% 0%, rgba(110, 80, 132, 0.08), transparent 30rem),
            linear-gradient(180deg, #f5fff9 0, #ffffff 34rem);
        }

        .siteHeader,
        .vacancyHero,
        .pageGrid,
        .similarSection,
        .candidateNotice,
        .siteFooter {
          width: min(1180px, calc(100% - 40px));
          margin-inline: auto;
        }

        .siteHeader {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brandLink {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: #2b2033;
          text-decoration: none;
        }

        .brandMark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #6e5084;
          color: #ffffff;
          font-size: 18px;
          box-shadow: 0 10px 24px rgba(110, 80, 132, 0.2);
        }

        .brandLink strong,
        .brandLink small {
          display: block;
        }

        .brandLink strong {
          font-size: 18px;
          line-height: 1;
          letter-spacing: 0.08em;
        }

        .brandLink small {
          margin-top: 3px;
          color: #6e5084;
          font-size: 12px;
          letter-spacing: 0.05em;
        }

        .headerLink,
        .textLink {
          color: #6e5084;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
        }

        .vacancyHero {
          margin-top: 30px;
          border: 1px solid rgba(110, 80, 132, 0.14);
          border-radius: 26px;
          background: linear-gradient(135deg, #ffffff, #f5fff9);
          padding: 38px;
          box-shadow: 0 22px 58px rgba(49, 39, 57, 0.08);
        }

        .breadcrumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #7a847f;
          font-size: 12px;
        }

        .breadcrumbs a {
          color: #6e5084;
          text-decoration: none;
        }

        .heroGrid {
          margin-top: 34px;
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.55fr);
          gap: 34px;
          align-items: start;
        }

        .organisationLine {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .organisationLogo,
        .organisationInitial {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          border-radius: 15px;
        }

        .organisationLogo {
          object-fit: contain;
          border: 1px solid #e5e8e7;
          background: #ffffff;
          padding: 7px;
        }

        .organisationInitial {
          display: grid;
          place-items: center;
          background: #6e5084;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #6e5084;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
        }

        .organisationName {
          margin: 0;
          color: #3c463f;
          font-size: 15px;
          font-weight: 750;
        }

        .heroMain h1 {
          margin: 30px 0 0;
          color: #251d2b;
          font-size: clamp(42px, 6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .heroSummary {
          max-width: 760px;
          margin: 24px 0 0;
          color: #5f6b65;
          font-size: 17px;
          line-height: 1.75;
        }

        .heroActions {
          margin-top: 30px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .primaryButton,
        .secondaryButton {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          padding: 0 18px;
          font: inherit;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          text-decoration: none;
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            border-color 150ms ease,
            background 150ms ease;
        }

        .primaryButton {
          border: 1px solid #6e5084;
          background: #6e5084;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(110, 80, 132, 0.17);
        }

        .primaryButton:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(110, 80, 132, 0.23);
        }

        .secondaryButton {
          border: 1px solid #d8d2dc;
          background: #ffffff;
          color: #604772;
        }

        .secondaryButton:hover {
          border-color: #6e5084;
          background: #faf7fc;
        }

        .fullButton {
          width: 100%;
        }

        .summaryCard,
        .applyCard,
        .employerCard,
        .contentCard,
        .noticeCard {
          border: 1px solid #e1e7e4;
          border-radius: 20px;
          background: #ffffff;
          padding: 28px;
          box-shadow: 0 12px 34px rgba(49, 57, 53, 0.055);
        }

        .summaryCard dl {
          margin: 20px 0 24px;
        }

        .summaryCard dl > div {
          display: grid;
          grid-template-columns: minmax(100px, 0.8fr) minmax(0, 1.2fr);
          gap: 18px;
          border-top: 1px solid #edf0ee;
          padding: 13px 0;
        }

        .summaryCard dl > div:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .summaryCard dt {
          color: #7a847f;
          font-size: 12px;
        }

        .summaryCard dd {
          margin: 0;
          color: #343d38;
          font-size: 13px;
          font-weight: 750;
          text-align: right;
        }

        .pageGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(290px, 0.65fr);
          gap: 24px;
          align-items: start;
        }

        .mainContent,
        .sideColumn {
          display: grid;
          gap: 24px;
        }

        .sideColumn {
          position: sticky;
          top: 20px;
        }

        .contentCard h2,
        .noticeCard h2,
        .applyCard h2,
        .employerCard h2,
        .sectionHeading h2,
        .candidateNotice h2 {
          margin: 0;
          color: #29212f;
          font-size: clamp(28px, 3.7vw, 42px);
          line-height: 1.1;
          letter-spacing: -0.035em;
        }

        .longText,
        .noticeCard p,
        .applyCard > p,
        .employerCard > p {
          white-space: pre-line;
          margin: 18px 0 0;
          color: #5f6b65;
          font-size: 15px;
          line-height: 1.8;
        }

        .contentList {
          margin: 20px 0 0;
          padding: 0;
          list-style: none;
        }

        .contentList li {
          position: relative;
          margin-top: 12px;
          padding-left: 26px;
          color: #59665f;
          font-size: 15px;
          line-height: 1.7;
        }

        .contentList li::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 1px;
          color: #6e5084;
          font-weight: 850;
        }

        .noticeCard {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          background: #f5fff9;
        }

        .noticeIcon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #ffffff;
          color: #5a456b;
          font-weight: 850;
        }

        .noticeCard p:last-child {
          margin-bottom: 0;
        }

        .applyCard h2,
        .employerCard h2 {
          font-size: 28px;
        }

        .applyCard .fullButton,
        .employerCard .fullButton {
          margin-top: 22px;
        }

        .smallPrint {
          margin-top: 15px !important;
          color: #7a847f !important;
          font-size: 12px !important;
          line-height: 1.55 !important;
        }

        .employerCard .textLink {
          display: block;
          margin-top: 16px;
        }

        .similarSection {
          padding: 74px 0 78px;
        }

        .sectionHeading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }

        .similarGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .similarCard {
          border: 1px solid #e1e7e4;
          border-radius: 18px;
          background: #ffffff;
          padding: 23px;
          box-shadow: 0 12px 34px rgba(49, 57, 53, 0.055);
        }

        .similarCard > p:first-child {
          margin: 0;
          color: #7b847f;
          font-size: 11px;
        }

        .similarCard h3 {
          margin: 8px 0 0;
          color: #29212f;
          font-size: 21px;
          line-height: 1.25;
        }

        .similarMeta {
          margin-top: 17px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .similarMeta span {
          border-radius: 999px;
          background: #f5fff9;
          padding: 7px 10px;
          color: #4d665a;
          font-size: 11px;
          font-weight: 700;
        }

        .similarSummary {
          min-height: 68px;
          display: -webkit-box;
          overflow: hidden;
          margin: 18px 0 22px;
          color: #69746e;
          font-size: 13px;
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .candidateNotice {
          margin-bottom: 70px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.8fr);
          gap: 48px;
          align-items: center;
          border-radius: 24px;
          background: #f5fff9;
          padding: 44px;
        }

        .candidateNotice > p {
          margin: 0;
          color: #5f6d66;
          font-size: 15px;
          line-height: 1.75;
        }

        .siteFooter {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #e7ebe9;
          padding: 27px 0 35px;
          color: #707b75;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .heroGrid,
          .pageGrid {
            grid-template-columns: 1fr;
          }

          .sideColumn {
            position: static;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .similarGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .siteHeader,
          .vacancyHero,
          .pageGrid,
          .similarSection,
          .candidateNotice,
          .siteFooter {
            width: min(100% - 28px, 1180px);
          }

          .siteHeader {
            min-height: 68px;
          }

          .vacancyHero {
            padding: 27px 23px;
          }

          .heroMain h1 {
            font-size: clamp(38px, 13vw, 56px);
          }

          .sideColumn,
          .similarGrid,
          .candidateNotice {
            grid-template-columns: 1fr;
          }

          .candidateNotice {
            gap: 22px;
            padding: 30px 24px;
          }

          .siteFooter {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .heroActions {
            align-items: stretch;
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton {
            width: 100%;
          }

          .summaryCard dl > div {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .summaryCard dd {
            text-align: left;
          }

          .noticeCard {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

const stateStyles = `
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #f5fff9;
  }

  .pageState {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 90% 5%, rgba(110, 80, 132, 0.1), transparent 28rem),
      #f5fff9;
    padding: 30px;
    color: #25202a;
    text-align: center;
  }

  .pageState h1 {
    margin: 20px 0 8px;
    font-size: clamp(30px, 5vw, 48px);
    letter-spacing: -0.04em;
  }

  .pageState p {
    max-width: 540px;
    margin: 0;
    color: #66716c;
    line-height: 1.7;
  }

  .stateIcon,
  .spinner {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #ffffff;
    color: #6e5084;
    font-weight: 850;
  }

  .errorIcon {
    background: #fff3f5;
    color: #a64d61;
  }

  .spinner {
    border: 3px solid #dfe7e2;
    border-top-color: #6e5084;
    background: transparent;
    animation: spin 800ms linear infinite;
  }

  .primaryButton {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 24px;
    border: 1px solid #6e5084;
    border-radius: 11px;
    background: #6e5084;
    padding: 0 18px;
    color: #ffffff;
    font: inherit;
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
    text-decoration: none;
  }

  .textLink {
    margin-top: 18px;
    color: #6e5084;
    font-size: 14px;
    font-weight: 750;
    text-decoration: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;