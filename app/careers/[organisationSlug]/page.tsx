"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type PublicVacancy = {
  organisation_id: string;
  organisation_slug: string;
  organisation_name: string;
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
  closing_date: string | null;
  published_at: string | null;
};

type OrganisationProfile = {
  organisation_id: string;
  organisation_slug: string;
  organisation_name: string;
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
};

type Filters = {
  search: string;
  location: string;
  employmentType: string;
};

const initialFilters: Filters = {
  search: "",
  location: "all",
  employmentType: "all",
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

function normaliseVacancy(row: any): PublicVacancy {
  return {
    organisation_id: text(row.organisation_id),
    organisation_slug: text(row.organisation_slug),
    organisation_name: text(row.organisation_name) || "Organisation",
    careers_heading: text(row.careers_heading) || null,
    careers_intro: text(row.careers_intro) || null,
    about_organisation: text(row.about_organisation) || null,
    benefits_summary: text(row.benefits_summary) || null,
    logo_url: text(row.logo_url) || null,
    hero_image_url: text(row.hero_image_url) || null,
    website_url: text(row.website_url) || null,
    careers_email: text(row.careers_email) || null,
    careers_phone: text(row.careers_phone) || null,
    linkedin_url: text(row.linkedin_url) || null,
    facebook_url: text(row.facebook_url) || null,
    instagram_url: text(row.instagram_url) || null,
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
    closing_date: text(row.closing_date) || null,
    published_at: text(row.published_at) || null,
  };
}

function toProfile(vacancy: PublicVacancy): OrganisationProfile {
  return {
    organisation_id: vacancy.organisation_id,
    organisation_slug: vacancy.organisation_slug,
    organisation_name: vacancy.organisation_name,
    careers_heading: vacancy.careers_heading,
    careers_intro: vacancy.careers_intro,
    about_organisation: vacancy.about_organisation,
    benefits_summary: vacancy.benefits_summary,
    logo_url: vacancy.logo_url,
    hero_image_url: vacancy.hero_image_url,
    website_url: vacancy.website_url,
    careers_email: vacancy.careers_email,
    careers_phone: vacancy.careers_phone,
    linkedin_url: vacancy.linkedin_url,
    facebook_url: vacancy.facebook_url,
    instagram_url: vacancy.instagram_url,
    primary_colour: vacancy.primary_colour,
    secondary_colour: vacancy.secondary_colour,
  };
}

function uniqueSorted(values: Array<string | null>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b));
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

export default function OrganisationCareersPage() {
  const params = useParams<{ organisationSlug: string }>();
  const organisationSlug = decodeURIComponent(params.organisationSlug || "");

  const [profile, setProfile] = useState<OrganisationProfile | null>(null);
  const [vacancies, setVacancies] = useState<PublicVacancy[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const loadOrganisation = useCallback(async () => {
    if (!organisationSlug) return;

    setLoading(true);
    setPageError("");
    setNotFound(false);

    const { data, error } = await supabase
      .from("leo_public_careers_vacancies")
      .select("*")
      .eq("organisation_slug", organisationSlug)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Organisation careers page could not be loaded:", error);
      setPageError(
        "This careers page could not be loaded. Please try again shortly.",
      );
      setLoading(false);
      return;
    }

    const normalised = (data ?? []).map((row: any) => normaliseVacancy(row));

    if (normalised.length === 0) {
      setProfile(null);
      setVacancies([]);
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(toProfile(normalised[0]));
    setVacancies(normalised);
    setLoading(false);
  }, [organisationSlug]);

  useEffect(() => {
    void loadOrganisation();
  }, [loadOrganisation]);

  const locations = useMemo(
    () => uniqueSorted(vacancies.map((vacancy) => vacancy.location_name)),
    [vacancies],
  );

  const employmentTypes = useMemo(
    () => uniqueSorted(vacancies.map((vacancy) => vacancy.employment_type)),
    [vacancies],
  );

  const filteredVacancies = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return vacancies.filter((vacancy) => {
      const haystack = [
        vacancy.title,
        vacancy.department,
        vacancy.business_area,
        vacancy.location_name,
        vacancy.employment_type,
        vacancy.work_pattern,
        vacancy.role_summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!search || haystack.includes(search)) &&
        (filters.location === "all" ||
          vacancy.location_name === filters.location) &&
        (filters.employmentType === "all" ||
          vacancy.employment_type === filters.employmentType)
      );
    });
  }, [filters, vacancies]);

  const activeFilterCount = [
    filters.search.trim(),
    filters.location !== "all",
    filters.employmentType !== "all",
  ].filter(Boolean).length;

  if (loading) {
    return (
      <main className="pageState">
        <span className="spinner" aria-hidden="true" />
        <h1>Loading careers page…</h1>
        <p>LEO is checking the organisation&apos;s current opportunities.</p>

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
        <h1>Careers page unavailable</h1>
        <p>{pageError}</p>
        <button
          type="button"
          className="primaryButton"
          onClick={() => void loadOrganisation()}
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

  if (notFound || !profile) {
    return (
      <main className="pageState">
        <span className="stateIcon" aria-hidden="true">
          ✦
        </span>
        <h1>Careers page not found</h1>
        <p>
          This organisation does not currently have a public careers page with
          live vacancies.
        </p>
        <Link href="/careers" className="primaryButton">
          View all opportunities
        </Link>

        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  return (
    <main className="organisationPage">
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

        <Link href="/careers" className="headerLink">
          All opportunities
        </Link>
      </header>

      <section
        className={`organisationHero ${
          profile.hero_image_url ? "withImage" : ""
        }`}
        style={
          profile.hero_image_url
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(33, 26, 38, 0.86), rgba(33, 26, 38, 0.52)), url("${profile.hero_image_url}")`,
              }
            : undefined
        }
      >
        <div className="organisationIdentity">
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo_url}
              alt={`${profile.organisation_name} logo`}
              className="organisationLogo"
            />
          ) : (
            <span className="organisationInitial" aria-hidden="true">
              {profile.organisation_name.charAt(0).toUpperCase()}
            </span>
          )}

          <div>
            <p className="eyebrow">CAREERS AT</p>
            <h1>{profile.organisation_name}</h1>
          </div>
        </div>

        <div className="heroContent">
          <h2>
            {profile.careers_heading ||
              `Build your future with ${profile.organisation_name}.`}
          </h2>
          <p>
            {profile.careers_intro ||
              "Explore current opportunities and learn more about joining the organisation."}
          </p>

          <div className="heroActions">
            <a href="#vacancies" className="primaryButton">
              View current vacancies
            </a>

            {profile.website_url ? (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noreferrer"
                className="secondaryButton"
              >
                Visit organisation website
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="contentGrid">
        <div className="mainContent">
          <section className="contentCard">
            <p className="eyebrow">ABOUT THE ORGANISATION</p>
            <h2>Work with {profile.organisation_name}</h2>
            <p className="longText">
              {profile.about_organisation ||
                "The organisation has not yet added a public introduction. Review the current vacancies below for role-specific information."}
            </p>
          </section>

          {profile.benefits_summary ? (
            <section className="contentCard benefitsCard">
              <p className="eyebrow">WORKING HERE</p>
              <h2>Benefits and working experience</h2>
              <p className="longText">{profile.benefits_summary}</p>
            </section>
          ) : null}
        </div>

        <aside className="contactCard">
          <p className="eyebrow">CAREERS CONTACT</p>
          <h2>Questions before applying?</h2>
          <p>
            Contact the recruiting organisation using the details provided
            below.
          </p>

          <div className="contactList">
            {profile.careers_email ? (
              <a href={`mailto:${profile.careers_email}`}>
                <span>Email</span>
                <strong>{profile.careers_email}</strong>
              </a>
            ) : null}

            {profile.careers_phone ? (
              <a href={`tel:${profile.careers_phone}`}>
                <span>Telephone</span>
                <strong>{profile.careers_phone}</strong>
              </a>
            ) : null}

            {profile.website_url ? (
              <a href={profile.website_url} target="_blank" rel="noreferrer">
                <span>Website</span>
                <strong>Open organisation website</strong>
              </a>
            ) : null}
          </div>

          <div className="socialLinks">
            {profile.linkedin_url ? (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
            {profile.facebook_url ? (
              <a href={profile.facebook_url} target="_blank" rel="noreferrer">
                Facebook
              </a>
            ) : null}
            {profile.instagram_url ? (
              <a href={profile.instagram_url} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}
          </div>
        </aside>
      </section>

      <section id="vacancies" className="vacanciesSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">CURRENT OPPORTUNITIES</p>
            <h2>Open vacancies</h2>
            <p>
              Review the details of each role before starting your application.
            </p>
          </div>

          <div className="resultCount" aria-live="polite">
            <strong>{filteredVacancies.length}</strong>
            <span>
              {filteredVacancies.length === 1 ? "vacancy" : "vacancies"}
            </span>
          </div>
        </div>

        <div className="searchPanel">
          <label className="searchField">
            <span>Search vacancies</span>
            <input
              type="search"
              value={filters.search}
              placeholder="Job title, department or keyword"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Location</span>
            <select
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            >
              <option value="all">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Employment type</span>
            <select
              value={filters.employmentType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  employmentType: event.target.value,
                }))
              }
            >
              <option value="all">All employment types</option>
              {employmentTypes.map((employmentType) => (
                <option key={employmentType} value={employmentType}>
                  {formatEmploymentType(employmentType)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="clearButton"
            disabled={activeFilterCount === 0}
            onClick={() => setFilters(initialFilters)}
          >
            Clear filters
          </button>
        </div>

        {filteredVacancies.length === 0 ? (
          <div className="emptyState">
            <span aria-hidden="true">✦</span>
            <h3>No vacancies match these filters</h3>
            <p>Try changing the search or clearing the filters.</p>
            <button
              type="button"
              className="secondaryButton"
              onClick={() => setFilters(initialFilters)}
            >
              View all vacancies
            </button>
          </div>
        ) : (
          <div className="vacancyGrid">
            {filteredVacancies.map((vacancy) => (
              <article key={vacancy.vacancy_id} className="vacancyCard">
                <div className="vacancyCardHeader">
                  <div>
                    <span>{vacancy.vacancy_reference}</span>
                    <h3>{vacancy.title}</h3>
                  </div>

                  {vacancy.number_of_positions &&
                  vacancy.number_of_positions > 1 ? (
                    <span className="positionsBadge">
                      {vacancy.number_of_positions} positions
                    </span>
                  ) : null}
                </div>

                <div className="vacancyDetails">
                  <div>
                    <span>Location</span>
                    <strong>{vacancy.location_name || "Not stated"}</strong>
                  </div>
                  <div>
                    <span>Employment type</span>
                    <strong>
                      {formatEmploymentType(vacancy.employment_type)}
                    </strong>
                  </div>
                  <div>
                    <span>Salary</span>
                    <strong>{formatSalary(vacancy)}</strong>
                  </div>
                  <div>
                    <span>Closing date</span>
                    <strong>{formatDate(vacancy.closing_date)}</strong>
                  </div>
                </div>

                <p className="vacancySummary">
                  {vacancy.role_summary ||
                    "Open the vacancy to review the full role information and application requirements."}
                </p>

                <div className="vacancyFooter">
                  <span>
                    {vacancy.department ||
                      vacancy.business_area ||
                      "Organisation-wide"}
                  </span>

                  <Link
                    href={`/careers/${encodeURIComponent(
                      profile.organisation_slug,
                    )}/${encodeURIComponent(vacancy.vacancy_slug)}`}
                    className="primaryButton compactButton"
                  >
                    View vacancy
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="candidateNotice">
        <div>
          <p className="eyebrow">CANDIDATE INFORMATION</p>
          <h2>A clear and structured application journey.</h2>
        </div>
        <p>
          Vacancy information and recruitment decisions are provided and made by
          {` ${profile.organisation_name}`}. LEO supports the organisation to
          manage the process consistently.
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

        .organisationPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 94% 0%, rgba(110, 80, 132, 0.08), transparent 30rem),
            linear-gradient(180deg, #f5fff9 0, #ffffff 34rem);
        }

        .siteHeader,
        .organisationHero,
        .contentGrid,
        .vacanciesSection,
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

        .organisationHero {
          margin-top: 30px;
          overflow: hidden;
          border: 1px solid rgba(110, 80, 132, 0.14);
          border-radius: 26px;
          background: linear-gradient(135deg, #ffffff, #f5fff9);
          box-shadow: 0 22px 58px rgba(49, 39, 57, 0.08);
          padding: 42px;
          background-size: cover;
          background-position: center;
        }

        .organisationHero.withImage {
          color: #ffffff;
        }

        .organisationIdentity {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .organisationLogo,
        .organisationInitial {
          width: 76px;
          height: 76px;
          flex: 0 0 76px;
          border-radius: 19px;
        }

        .organisationLogo {
          object-fit: contain;
          border: 1px solid #e5e8e7;
          background: #ffffff;
          padding: 8px;
        }

        .organisationInitial {
          display: grid;
          place-items: center;
          background: #6e5084;
          color: #ffffff;
          font-size: 30px;
          font-weight: 850;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #6e5084;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
        }

        .withImage .eyebrow {
          color: #e9dff0;
        }

        .organisationIdentity h1 {
          margin: 0;
          color: #29202f;
          font-size: clamp(28px, 4vw, 46px);
          letter-spacing: -0.035em;
        }

        .withImage .organisationIdentity h1,
        .withImage .heroContent h2,
        .withImage .heroContent p {
          color: #ffffff;
        }

        .heroContent {
          max-width: 760px;
          margin-top: 44px;
        }

        .heroContent h2 {
          margin: 0;
          color: #251d2b;
          font-size: clamp(38px, 5.5vw, 64px);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .heroContent p {
          margin: 24px 0 0;
          color: #5f6b65;
          font-size: 17px;
          line-height: 1.75;
        }

        .heroActions {
          margin-top: 30px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primaryButton,
        .secondaryButton,
        .clearButton {
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

        .secondaryButton,
        .clearButton {
          border: 1px solid #d8d2dc;
          background: #ffffff;
          color: #604772;
        }

        .secondaryButton:hover,
        .clearButton:hover:not(:disabled) {
          border-color: #6e5084;
          background: #faf7fc;
        }

        .clearButton:disabled {
          cursor: not-allowed;
          opacity: 0.48;
        }

        .contentGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.6fr);
          gap: 24px;
          align-items: start;
        }

        .mainContent {
          display: grid;
          gap: 24px;
        }

        .contentCard,
        .contactCard {
          border: 1px solid #e1e7e4;
          border-radius: 20px;
          background: #ffffff;
          padding: 30px;
          box-shadow: 0 12px 34px rgba(49, 57, 53, 0.055);
        }

        .benefitsCard {
          background: #f5fff9;
        }

        .contentCard h2,
        .contactCard h2,
        .sectionHeading h2,
        .candidateNotice h2 {
          margin: 0;
          color: #29212f;
          font-size: clamp(28px, 3.7vw, 42px);
          line-height: 1.1;
          letter-spacing: -0.035em;
        }

        .longText,
        .contactCard > p {
          white-space: pre-line;
          margin: 18px 0 0;
          color: #5f6b65;
          font-size: 15px;
          line-height: 1.8;
        }

        .contactList {
          margin-top: 24px;
          display: grid;
          gap: 12px;
        }

        .contactList a {
          display: block;
          border: 1px solid #e6eae8;
          border-radius: 12px;
          padding: 14px;
          color: #2e3732;
          text-decoration: none;
        }

        .contactList span,
        .contactList strong {
          display: block;
        }

        .contactList span {
          color: #77817c;
          font-size: 11px;
          text-transform: uppercase;
        }

        .contactList strong {
          margin-top: 4px;
          overflow-wrap: anywhere;
          font-size: 13px;
        }

        .socialLinks {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .socialLinks a {
          color: #6e5084;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
        }

        .vacanciesSection {
          padding: 72px 0 80px;
          scroll-margin-top: 20px;
        }

        .sectionHeading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 28px;
        }

        .sectionHeading > div > p:not(.eyebrow) {
          margin: 12px 0 0;
          color: #68736e;
          line-height: 1.65;
        }

        .resultCount {
          min-width: 112px;
          padding: 15px 18px;
          border: 1px solid #e2e6e4;
          border-radius: 14px;
          background: #ffffff;
          text-align: center;
        }

        .resultCount strong,
        .resultCount span {
          display: block;
        }

        .resultCount strong {
          color: #6e5084;
          font-size: 25px;
        }

        .resultCount span {
          margin-top: 2px;
          color: #6d7772;
          font-size: 12px;
        }

        .searchPanel {
          margin-top: 30px;
          display: grid;
          grid-template-columns: minmax(280px, 1.5fr) repeat(2, minmax(170px, 0.75fr)) auto;
          gap: 13px;
          align-items: end;
          padding: 20px;
          border: 1px solid #e1e7e4;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 12px 34px rgba(49, 57, 53, 0.06);
        }

        .searchPanel label {
          display: grid;
          gap: 7px;
          color: #4c5651;
          font-size: 12px;
          font-weight: 750;
        }

        .searchPanel input,
        .searchPanel select {
          width: 100%;
          min-height: 46px;
          border: 1px solid #d8dfdb;
          border-radius: 10px;
          background: #ffffff;
          padding: 0 13px;
          color: #26302b;
          font: inherit;
          font-size: 14px;
          outline: none;
        }

        .searchPanel input:focus,
        .searchPanel select:focus {
          border-color: #6e5084;
          box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.12);
        }

        .vacancyGrid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .vacancyCard {
          min-width: 0;
          border: 1px solid #e1e7e4;
          border-radius: 19px;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 12px 35px rgba(46, 53, 49, 0.055);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease;
        }

        .vacancyCard:hover {
          transform: translateY(-2px);
          border-color: rgba(110, 80, 132, 0.3);
          box-shadow: 0 18px 44px rgba(46, 53, 49, 0.09);
        }

        .vacancyCardHeader,
        .vacancyFooter {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .vacancyCardHeader > div > span {
          color: #7b847f;
          font-size: 11px;
        }

        .vacancyCardHeader h3 {
          margin: 6px 0 0;
          color: #27202d;
          font-size: 23px;
          line-height: 1.22;
          letter-spacing: -0.02em;
        }

        .positionsBadge {
          flex: 0 0 auto;
          border-radius: 999px;
          background: #f5fff9;
          padding: 7px 10px;
          color: #3f725b;
          font-size: 11px;
          font-weight: 750;
        }

        .vacancyDetails {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .vacancyDetails span,
        .vacancyDetails strong {
          display: block;
        }

        .vacancyDetails span {
          color: #7a847f;
          font-size: 10px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .vacancyDetails strong {
          margin-top: 4px;
          color: #3a443f;
          font-size: 13px;
          line-height: 1.45;
        }

        .vacancySummary {
          display: -webkit-box;
          overflow: hidden;
          margin: 21px 0 0;
          color: #68736e;
          font-size: 14px;
          line-height: 1.65;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .vacancyFooter {
          align-items: center;
          margin-top: 22px;
          border-top: 1px solid #edf0ee;
          padding-top: 17px;
        }

        .vacancyFooter > span {
          color: #707a75;
          font-size: 12px;
        }

        .compactButton {
          min-height: 40px;
          padding-inline: 15px;
        }

        .emptyState {
          min-height: 280px;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e7e4;
          border-radius: 19px;
          background: #ffffff;
          padding: 40px 24px;
          text-align: center;
        }

        .emptyState > span {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f5fff9;
          color: #6e5084;
        }

        .emptyState h3 {
          margin: 18px 0 7px;
          color: #2c2432;
          font-size: 21px;
        }

        .emptyState p {
          margin: 0;
          color: #6a756f;
        }

        .emptyState button {
          margin-top: 20px;
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
          .contentGrid {
            grid-template-columns: 1fr;
          }

          .searchPanel {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .searchField {
            grid-column: 1 / -1;
          }

          .clearButton {
            width: 100%;
          }
        }

        @media (max-width: 760px) {
          .siteHeader,
          .organisationHero,
          .contentGrid,
          .vacanciesSection,
          .candidateNotice,
          .siteFooter {
            width: min(100% - 28px, 1180px);
          }

          .siteHeader {
            min-height: 68px;
          }

          .organisationHero {
            padding: 28px 24px;
          }

          .organisationIdentity {
            align-items: flex-start;
          }

          .organisationLogo,
          .organisationInitial {
            width: 60px;
            height: 60px;
            flex-basis: 60px;
          }

          .heroContent {
            margin-top: 34px;
          }

          .sectionHeading {
            align-items: flex-start;
          }

          .resultCount {
            display: none;
          }

          .searchPanel,
          .vacancyGrid,
          .candidateNotice {
            grid-template-columns: 1fr;
          }

          .searchField {
            grid-column: auto;
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
          .heroActions,
          .vacancyFooter {
            align-items: stretch;
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton,
          .clearButton {
            width: 100%;
          }

          .vacancyDetails {
            grid-template-columns: 1fr;
          }

          .positionsBadge {
            display: none;
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