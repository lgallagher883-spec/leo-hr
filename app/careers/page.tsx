"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PublicVacancy = {
  organisation_id: string;
  organisation_slug: string;
  organisation_name: string;
  logo_url: string | null;
  primary_colour: string | null;
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

type FilterState = {
  search: string;
  organisation: string;
  location: string;
  employmentType: string;
};

const initialFilters: FilterState = {
  search: "",
  organisation: "all",
  location: "all",
  employmentType: "all",
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseVacancy(row: Record<string, unknown>): PublicVacancy {
  return {
    organisation_id: readText(row.organisation_id),
    organisation_slug: readText(row.organisation_slug),
    organisation_name:
      readText(row.organisation_name) || "Organisation",
    logo_url: readText(row.logo_url) || null,
    primary_colour: readText(row.primary_colour) || null,
    vacancy_id: readText(row.vacancy_id),
    vacancy_reference: readText(row.vacancy_reference),
    vacancy_slug: readText(row.vacancy_slug),
    title: readText(row.title) || "Untitled vacancy",
    department: readText(row.department) || null,
    business_area: readText(row.business_area) || null,
    location_name: readText(row.location_name) || null,
    employment_type: readText(row.employment_type) || null,
    work_pattern: readText(row.work_pattern) || null,
    hours_per_week:
      typeof row.hours_per_week === "number"
        ? row.hours_per_week
        : row.hours_per_week
          ? Number(row.hours_per_week)
          : null,
    salary_min:
      typeof row.salary_min === "number"
        ? row.salary_min
        : row.salary_min
          ? Number(row.salary_min)
          : null,
    salary_max:
      typeof row.salary_max === "number"
        ? row.salary_max
        : row.salary_max
          ? Number(row.salary_max)
          : null,
    salary_period: readText(row.salary_period) || null,
    salary_currency: readText(row.salary_currency) || "GBP",
    salary_visible: row.salary_visible !== false,
    number_of_positions:
      typeof row.number_of_positions === "number"
        ? row.number_of_positions
        : row.number_of_positions
          ? Number(row.number_of_positions)
          : null,
    role_summary: readText(row.role_summary) || null,
    closing_date: readText(row.closing_date) || null,
    published_at: readText(row.published_at) || null,
  };
}

function uniqueSorted(values: Array<string | null>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b));
}

function formatEmploymentType(value: string | null): string {
  if (!value) return "Employment type not stated";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "Open until filled";

  const parsed = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

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

  const currency = vacancy.salary_currency || "GBP";
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
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

export default function CareersLandingPage() {
  const [vacancies, setVacancies] = useState<PublicVacancy[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadVacancies = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const { data, error } = await supabase
      .from("leo_public_careers_vacancies")
      .select(
        [
          "organisation_id",
          "organisation_slug",
          "organisation_name",
          "logo_url",
          "primary_colour",
          "vacancy_id",
          "vacancy_reference",
          "vacancy_slug",
          "title",
          "department",
          "business_area",
          "location_name",
          "employment_type",
          "work_pattern",
          "hours_per_week",
          "salary_min",
          "salary_max",
          "salary_period",
          "salary_currency",
          "salary_visible",
          "number_of_positions",
          "role_summary",
          "closing_date",
          "published_at",
        ].join(","),
      )
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Public vacancies could not be loaded:", error);
      setPageError(
        "Current opportunities could not be loaded. Please try again shortly.",
      );
      setVacancies([]);
      setLoading(false);
      return;
    }

    setVacancies(
  (data ?? []).map((row: any) => normaliseVacancy(row)),
);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  const organisations = useMemo(
    () => uniqueSorted(vacancies.map((vacancy) => vacancy.organisation_name)),
    [vacancies],
  );

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
      const searchableText = [
        vacancy.title,
        vacancy.organisation_name,
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
        (!search || searchableText.includes(search)) &&
        (filters.organisation === "all" ||
          vacancy.organisation_name === filters.organisation) &&
        (filters.location === "all" ||
          vacancy.location_name === filters.location) &&
        (filters.employmentType === "all" ||
          vacancy.employment_type === filters.employmentType)
      );
    });
  }, [filters, vacancies]);

  const activeFilterCount = [
    filters.search.trim(),
    filters.organisation !== "all",
    filters.location !== "all",
    filters.employmentType !== "all",
  ].filter(Boolean).length;

  return (
    <main className="careersPage">
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

        <a href="#opportunities" className="headerAction">
          View opportunities
        </a>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">LEO CAREERS</p>
          <h1>Find work where you can make a difference.</h1>
          <p className="heroText">
            Explore current opportunities from employers using LEO to create
            clear, fair and professionally managed recruitment experiences.
          </p>

          <div className="heroActions">
            <a href="#opportunities" className="primaryButton">
              Search opportunities
            </a>
            <span className="jurisdictionNote">
              Opportunities managed in England &amp; Wales
            </span>
          </div>
        </div>

        <div className="heroPanel" aria-label="What candidates can expect">
          <span className="heroPanelIcon" aria-hidden="true">
            ✦
          </span>
          <h2>A clearer candidate experience</h2>
          <p>
            Relevant information, structured applications and communication
            throughout the recruitment process.
          </p>

          <div className="expectationGrid">
            <div>
              <strong>Clear roles</strong>
              <span>Understand the opportunity before applying.</span>
            </div>
            <div>
              <strong>Fair process</strong>
              <span>Applications follow the employer&apos;s agreed workflow.</span>
            </div>
            <div>
              <strong>Connected journey</strong>
              <span>Recruitment can flow into onboarding without re-entry.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="opportunitiesSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">CURRENT OPPORTUNITIES</p>
            <h2>Explore live vacancies</h2>
            <p>
              Search by role, employer or location and review the full vacancy
              before applying.
            </p>
          </div>

          {!loading && !pageError ? (
            <div className="resultCount" aria-live="polite">
              <strong>{filteredVacancies.length}</strong>
              <span>
                {filteredVacancies.length === 1 ? "vacancy" : "vacancies"}
              </span>
            </div>
          ) : null}
        </div>

        <div className="searchPanel">
          <label className="searchField">
            <span>Search vacancies</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Job title, employer, department or location"
            />
          </label>

          <label>
            <span>Employer</span>
            <select
              value={filters.organisation}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  organisation: event.target.value,
                }))
              }
            >
              <option value="all">All employers</option>
              {organisations.map((organisation) => (
                <option key={organisation} value={organisation}>
                  {organisation}
                </option>
              ))}
            </select>
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
            onClick={() => setFilters(initialFilters)}
            disabled={activeFilterCount === 0}
          >
            Clear filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        {loading ? (
          <div className="statePanel" role="status">
            <span className="spinner" aria-hidden="true" />
            <h3>Loading current opportunities…</h3>
            <p>LEO is checking which vacancies are open for applications.</p>
          </div>
        ) : pageError ? (
          <div className="statePanel errorPanel" role="alert">
            <span className="stateIcon" aria-hidden="true">
              !
            </span>
            <h3>Opportunities are temporarily unavailable</h3>
            <p>{pageError}</p>
            <button
              type="button"
              className="secondaryButton"
              onClick={() => void loadVacancies()}
            >
              Try again
            </button>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="statePanel">
            <span className="stateIcon" aria-hidden="true">
              ✦
            </span>
            <h3>
              {vacancies.length === 0
                ? "There are no live vacancies at the moment"
                : "No vacancies match these filters"}
            </h3>
            <p>
              {vacancies.length === 0
                ? "Please check again soon for newly published opportunities."
                : "Try a broader search or clear the filters to view all current opportunities."}
            </p>
            {vacancies.length > 0 ? (
              <button
                type="button"
                className="secondaryButton"
                onClick={() => setFilters(initialFilters)}
              >
                View all vacancies
              </button>
            ) : null}
          </div>
        ) : (
          <div className="vacancyGrid">
            {filteredVacancies.map((vacancy) => (
              <article key={vacancy.vacancy_id} className="vacancyCard">
                <div className="cardTop">
                  <div className="organisationIdentity">
                    {vacancy.logo_url ? (
                      // Supabase-hosted or employer-provided public asset.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={vacancy.logo_url}
                        alt=""
                        className="organisationLogo"
                      />
                    ) : (
                      <span className="organisationInitial" aria-hidden="true">
                        {vacancy.organisation_name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div>
                      <span className="organisationName">
                        {vacancy.organisation_name}
                      </span>
                      <span className="vacancyReference">
                        {vacancy.vacancy_reference}
                      </span>
                    </div>
                  </div>

                  {vacancy.number_of_positions &&
                  vacancy.number_of_positions > 1 ? (
                    <span className="positionsBadge">
                      {vacancy.number_of_positions} positions
                    </span>
                  ) : null}
                </div>

                <div className="cardBody">
                  <h3>{vacancy.title}</h3>

                  <div className="vacancyMeta">
                    <span>
                      <strong>Location</strong>
                      {vacancy.location_name || "Not stated"}
                    </span>
                    <span>
                      <strong>Type</strong>
                      {formatEmploymentType(vacancy.employment_type)}
                    </span>
                    <span>
                      <strong>Salary</strong>
                      {formatSalary(vacancy)}
                    </span>
                    <span>
                      <strong>Closing date</strong>
                      {formatDate(vacancy.closing_date)}
                    </span>
                  </div>

                  <p className="vacancySummary">
                    {vacancy.role_summary ||
                      "Review the full vacancy information to understand the role, requirements and application process."}
                  </p>
                </div>

                <div className="cardFooter">
                  <Link
                    href={`/careers/${encodeURIComponent(
                      vacancy.organisation_slug,
                    )}`}
                    className="employerLink"
                  >
                    View employer
                  </Link>

                  <Link
                    href={`/careers/${encodeURIComponent(
                      vacancy.organisation_slug,
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

      <section className="candidateNote">
        <div>
          <p className="eyebrow">ABOUT LEO CAREERS</p>
          <h2>Recruitment technology with professional judgement at its centre.</h2>
        </div>
        <p>
          LEO supports employers to manage recruitment consistently. Employers
          remain responsible for every recruitment decision, and the information
          shown on each vacancy is provided by the recruiting organisation.
        </p>
      </section>

      <footer className="siteFooter">
        <span>© {new Date().getFullYear()} LEO HR LTD</span>
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
          color: #17202a;
        }

        .careersPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 90% 5%, rgba(110, 80, 132, 0.08), transparent 28rem),
            linear-gradient(180deg, #f5fff9 0, #ffffff 34rem);
        }

        .siteHeader {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
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

        .headerAction {
          color: #6e5084;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
        }

        .hero {
          width: min(1180px, calc(100% - 40px));
          margin: 34px auto 74px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
          align-items: stretch;
          gap: 28px;
        }

        .heroCopy {
          padding: 64px 0 48px;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #6e5084;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
        }

        h1 {
          max-width: 760px;
          margin: 0;
          color: #211a26;
          font-size: clamp(44px, 6.3vw, 76px);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .heroText {
          max-width: 680px;
          margin: 28px 0 0;
          color: #52605a;
          font-size: 18px;
          line-height: 1.75;
        }

        .heroActions {
          margin-top: 34px;
          display: flex;
          align-items: center;
          gap: 20px;
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
          border: 1px solid #d9d2de;
          background: #ffffff;
          color: #5d436f;
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

        .jurisdictionNote {
          color: #66716c;
          font-size: 13px;
        }

        .heroPanel {
          align-self: stretch;
          padding: 36px;
          border: 1px solid rgba(110, 80, 132, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 22px 60px rgba(57, 40, 69, 0.09);
          backdrop-filter: blur(10px);
        }

        .heroPanelIcon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #f5fff9;
          color: #6e5084;
          font-size: 19px;
        }

        .heroPanel h2 {
          margin: 26px 0 10px;
          color: #2b2033;
          font-size: 27px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .heroPanel > p {
          margin: 0;
          color: #68736e;
          font-size: 15px;
          line-height: 1.65;
        }

        .expectationGrid {
          margin-top: 28px;
          display: grid;
          gap: 14px;
        }

        .expectationGrid div {
          padding: 17px;
          border: 1px solid #e7ece9;
          border-radius: 14px;
          background: #fbfdfc;
        }

        .expectationGrid strong,
        .expectationGrid span {
          display: block;
        }

        .expectationGrid strong {
          color: #32283a;
          font-size: 14px;
        }

        .expectationGrid span {
          margin-top: 5px;
          color: #6c7671;
          font-size: 13px;
          line-height: 1.5;
        }

        .opportunitiesSection {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 54px 0 80px;
          scroll-margin-top: 20px;
        }

        .sectionHeading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 28px;
        }

        .sectionHeading h2,
        .candidateNote h2 {
          margin: 0;
          color: #271f2d;
          font-size: clamp(30px, 4vw, 45px);
          line-height: 1.08;
          letter-spacing: -0.035em;
        }

        .sectionHeading p:not(.eyebrow) {
          max-width: 680px;
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
          grid-template-columns: minmax(260px, 1.5fr) repeat(3, minmax(150px, 0.75fr)) auto;
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
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e1e7e4;
          border-radius: 19px;
          background: #ffffff;
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

        .cardTop,
        .cardFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .cardTop {
          padding: 18px 20px;
          border-bottom: 1px solid #edf0ee;
          background: #fbfdfc;
        }

        .organisationIdentity {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .organisationLogo,
        .organisationInitial {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 11px;
        }

        .organisationLogo {
          object-fit: contain;
          border: 1px solid #e4e8e6;
          background: #ffffff;
          padding: 4px;
        }

        .organisationInitial {
          display: grid;
          place-items: center;
          background: #f0eaf4;
          color: #6e5084;
          font-weight: 850;
        }

        .organisationName,
        .vacancyReference {
          display: block;
        }

        .organisationName {
          overflow: hidden;
          color: #312839;
          font-size: 13px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vacancyReference {
          margin-top: 3px;
          color: #7b847f;
          font-size: 11px;
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

        .cardBody {
          flex: 1;
          padding: 23px 22px;
        }

        .cardBody h3 {
          margin: 0;
          color: #27202d;
          font-size: 23px;
          line-height: 1.22;
          letter-spacing: -0.02em;
        }

        .vacancyMeta {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .vacancyMeta span {
          min-width: 0;
          color: #59645f;
          font-size: 13px;
          line-height: 1.45;
        }

        .vacancyMeta strong {
          display: block;
          margin-bottom: 3px;
          color: #303a35;
          font-size: 11px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
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

        .cardFooter {
          padding: 17px 20px;
          border-top: 1px solid #edf0ee;
        }

        .employerLink {
          color: #6e5084;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
        }

        .compactButton {
          min-height: 40px;
          padding-inline: 15px;
        }

        .statePanel {
          margin-top: 24px;
          min-height: 290px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e7e4;
          border-radius: 19px;
          background: #ffffff;
          padding: 42px 24px;
          text-align: center;
        }

        .statePanel h3 {
          margin: 18px 0 7px;
          color: #2c2432;
          font-size: 21px;
        }

        .statePanel p {
          max-width: 540px;
          margin: 0;
          color: #6a756f;
          line-height: 1.65;
        }

        .statePanel button {
          margin-top: 20px;
        }

        .stateIcon,
        .spinner {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f5fff9;
          color: #6e5084;
          font-weight: 850;
        }

        .spinner {
          border: 3px solid #e7eee9;
          border-top-color: #6e5084;
          background: transparent;
          animation: spin 800ms linear infinite;
        }

        .errorPanel {
          border-color: #eadcdf;
          background: #fffafb;
        }

        .errorPanel .stateIcon {
          background: #f9ecef;
          color: #a44b60;
        }

        .candidateNote {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto 70px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.8fr);
          gap: 48px;
          align-items: center;
          border-radius: 24px;
          background: #f5fff9;
          padding: 44px;
        }

        .candidateNote > p {
          margin: 0;
          color: #5f6d66;
          font-size: 15px;
          line-height: 1.75;
        }

        .siteFooter {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #e7ebe9;
          padding: 27px 0 35px;
          color: #707b75;
          font-size: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .hero {
            grid-template-columns: 1fr;
            margin-top: 10px;
          }

          .heroCopy {
            padding-bottom: 12px;
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
          .hero,
          .opportunitiesSection,
          .candidateNote,
          .siteFooter {
            width: min(100% - 28px, 1180px);
          }

          .siteHeader {
            min-height: 68px;
          }

          .headerAction {
            display: none;
          }

          .hero {
            margin-bottom: 42px;
          }

          .heroCopy {
            padding-top: 38px;
          }

          h1 {
            font-size: clamp(42px, 13vw, 62px);
          }

          .heroText {
            font-size: 16px;
          }

          .heroPanel {
            padding: 26px;
          }

          .sectionHeading {
            align-items: flex-start;
          }

          .resultCount {
            display: none;
          }

          .searchPanel,
          .vacancyGrid,
          .candidateNote {
            grid-template-columns: 1fr;
          }

          .searchField {
            grid-column: auto;
          }

          .vacancyMeta {
            grid-template-columns: 1fr;
          }

          .candidateNote {
            gap: 22px;
            padding: 30px 24px;
          }

          .siteFooter {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .heroActions,
          .cardFooter {
            align-items: stretch;
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton,
          .clearButton {
            width: 100%;
          }

          .employerLink {
            text-align: center;
          }

          .cardTop {
            align-items: flex-start;
          }

          .positionsBadge {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(html) {
            scroll-behavior: auto;
          }

          .primaryButton,
          .secondaryButton,
          .clearButton,
          .vacancyCard {
            transition: none;
          }

          .spinner {
            animation-duration: 1600ms;
          }
        }
      `}</style>
    </main>
  );
}