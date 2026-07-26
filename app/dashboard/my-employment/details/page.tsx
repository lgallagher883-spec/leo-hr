"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MyEmploymentResponse = {
  success: boolean;
  employee?: {
    id: number;
    name: string;
    email: string | null;
    role: string | null;
    status: string | null;
    startDate: string | null;
  };
  employmentDetails?: {
    manager: string | null;
    probationEndDate: string | null;
    employmentEndDate: string | null;
    reasonForLeaving: string | null;
    annualLeaveAllowance: string | null;
  };
  error?: string;
};

type DetailRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function DetailRow({
  label,
  value,
  isLast = false,
}: DetailRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(180px, 0.9fr) minmax(0, 1.6fr)",
        gap: "24px",
        padding: "16px 0",
        borderBottom: isLast
          ? "none"
          : "1px solid #F1F5F9",
        alignItems: "start",
      }}
    >
      <strong
        style={{
          color: "#334155",
          fontSize: "14px",
        }}
      >
        {label}
      </strong>

      <span
        style={{
          color: value === "—" ? "#94A3B8" : "#0F172A",
          fontSize: "14px",
          textAlign: "right",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
        12,
        0,
        0
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLeaveAllowance(
  value: string | null | undefined
) {
  if (!value || !value.trim()) {
    return "—";
  }

  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    String(numericValue) === value.trim()
  ) {
    return `${numericValue} ${
      numericValue === 1 ? "day" : "days"
    }`;
  }

  return value;
}

export default function EmploymentDetailsPage() {
  const [data, setData] =
    useState<MyEmploymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmploymentDetails() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/my-employment",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const payload =
          (await response.json()) as MyEmploymentResponse;

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error ||
              "Your employment details could not be loaded."
          );
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Your employment details could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmploymentDetails();

    return () => {
      cancelled = true;
    };
  }, []);

  const employee = data?.employee;
  const details = data?.employmentDetails;

  const fields = [
    {
      label: "Employment status",
      value: employee?.status || "—",
    },
    {
      label: "Job title",
      value: employee?.role || "—",
    },
    {
      label: "Manager",
      value: details?.manager || "—",
    },
    {
      label: "Start date",
      value: formatDate(employee?.startDate),
    },
    {
      label: "Probation end date",
      value: formatDate(
        details?.probationEndDate
      ),
    },
    {
      label: "Annual leave entitlement",
      value: formatLeaveAllowance(
        details?.annualLeaveAllowance
      ),
    },
  ];

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          color: "#6E5084",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Employee Workspace
      </p>

      <h1
        style={{
          fontSize: 32,
          color: "#6E5084",
          margin: "0 0 10px",
        }}
      >
        Employment Details
      </h1>

      <p
        style={{
          color: "#64748B",
          marginBottom: 24,
          maxWidth: 760,
          lineHeight: 1.7,
        }}
      >
        View the employment information held by your
        organisation. These details are read-only in the
        employee workspace.
      </p>

      {loading ? (
        <section
          aria-live="polite"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E2EB",
            borderRadius: 18,
            padding: 24,
            boxShadow:
              "0 8px 22px rgba(17,24,39,.05)",
          }}
        >
          <div
            style={{
              height: 18,
              width: "38%",
              background: "#F1EDF4",
              borderRadius: 999,
              marginBottom: 20,
            }}
          />

          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(180px, 0.9fr) minmax(0, 1.6fr)",
                gap: 24,
                padding: "16px 0",
                borderBottom:
                  item === 6
                    ? "none"
                    : "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  height: 14,
                  width: "55%",
                  background: "#F1F5F9",
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: "45%",
                  background: "#F1F5F9",
                  borderRadius: 999,
                  justifySelf: "end",
                }}
              />
            </div>
          ))}
        </section>
      ) : error ? (
        <section
          role="alert"
          style={{
            background: "#FFF7F7",
            border: "1px solid #F1CACA",
            borderRadius: 18,
            padding: 24,
            boxShadow:
              "0 8px 22px rgba(17,24,39,.04)",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              color: "#991B1B",
              fontSize: 18,
            }}
          >
            Employment details unavailable
          </h2>

          <p
            style={{
              margin: 0,
              color: "#7F1D1D",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        </section>
      ) : (
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E2EB",
            borderRadius: 18,
            padding: "8px 24px",
            boxShadow:
              "0 8px 22px rgba(17,24,39,.05)",
          }}
        >
          <div
            style={{
              padding: "18px 0 8px",
              borderBottom:
                "1px solid #F1F5F9",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0F172A",
                fontSize: 19,
              }}
            >
              {employee?.name ||
                "Employment record"}
            </h2>

            {employee?.email ? (
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748B",
                  fontSize: 14,
                }}
              >
                {employee.email}
              </p>
            ) : null}
          </div>

          {fields.map((field, index) => (
            <DetailRow
              key={field.label}
              label={field.label}
              value={field.value}
              isLast={index === fields.length - 1}
            />
          ))}
        </section>
      )}

      <div
        style={{
          marginTop: 24,
        }}
      >
        <Link
          href="/dashboard/my-employment"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            border: "1px solid #CDB2E2",
            borderRadius: 10,
            textDecoration: "none",
            color: "#6E5084",
            fontWeight: 700,
            background: "#FFFFFF",
          }}
        >
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}