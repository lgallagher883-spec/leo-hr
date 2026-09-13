"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReminderSettings = {
  standardDaysBefore: number[];
  sarDaysBefore: number[];
  dueDayAlwaysEnabled: boolean;
};

function normaliseInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[ ,;]+/)
        .map((item) => Number(item.trim()))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item >= 1 &&
            item <= 90,
        ),
    ),
  ).sort((a, b) => b - a);
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] =
    useState<ReminderSettings | null>(null);
  const [daysInput, setDaysInput] = useState("30, 7");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const parsedDays = useMemo(
    () => normaliseInput(daysInput),
    [daysInput],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/reminders/settings", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error ||
              "Notification settings could not be loaded.",
          );
        }

        if (!active) return;

        setSettings(result.settings);
        setDaysInput(
          result.settings.standardDaysBefore.join(", "),
        );
      } catch (caughtError) {
        if (!active) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Notification settings could not be loaded.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function choosePreset(days: number[]) {
    setDaysInput(days.join(", "));
    setMessage("");
    setError("");
  }

  async function save() {
    setMessage("");
    setError("");

    if (parsedDays.length < 1 || parsedDays.length > 4) {
      setError(
        "Enter between 1 and 4 reminder points, for example 30, 14, 7.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/reminders/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          standardDaysBefore: parsedDays,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "Notification settings could not be saved.",
        );
      }

      setSettings(result.settings);
      setDaysInput(
        result.settings.standardDaysBefore.join(", "),
      );
      setMessage("Reminder timings saved for this organisation.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Notification settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={topRowStyle}>
        <div>
          <div style={eyebrowStyle}>Foundations</div>
          <h1 style={titleStyle}>Notifications</h1>
          <p style={subtitleStyle}>
            Choose when Leo should surface standard compliance and
            learning reminders.
          </p>
        </div>

        <Link href="/dashboard/foundations" style={backLinkStyle}>
          Back to Foundations
        </Link>
      </div>

      {error ? (
        <div style={errorStyle} role="alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div style={successStyle} role="status">
          {message}
        </div>
      ) : null}

      <section style={cardStyle}>
        <h2 style={cardTitleStyle}>Standard reminder timings</h2>
        <p style={copyStyle}>
          These reminder points are fully editable for this organisation. Choose a common preset or enter your own timings below.
        </p>

        <div style={presetGridStyle}>
          {reminderPresets.map((preset) => {
            const active =
              preset.value.join(",") === parsedDays.join(",");

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => choosePreset(preset.value)}
                disabled={loading || saving}
                style={{
                  ...presetButtonStyle,
                  ...(active ? activePresetButtonStyle : {}),
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <label style={labelStyle}>
          Custom reminder days
          <input
            type="text"
            value={daysInput}
            onChange={(event) => {
              setDaysInput(event.target.value);
              setMessage("");
              setError("");
            }}
            placeholder="For example: 45, 21, 7, 1"
            disabled={loading || saving}
            style={inputStyle}
          />
        </label>

        <div style={helperStyle}>
          Enter between 1 and 4 reminder points, each from 1 to 90 days before the due date. Separate them with commas.
        </div>

        <div style={previewStyle}>
          {parsedDays.length > 0
            ? `Leo will remind at ${parsedDays
                .map((day) => `${day} day${day === 1 ? "" : "s"} before`)
                .join(", ")} and again when due.`
            : "Enter at least one reminder point."}
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          style={buttonStyle}
        >
          {saving ? "Saving..." : "Save reminder timings"}
        </button>
      </section>

      <section style={cardStyle}>
        <h2 style={cardTitleStyle}>SAR deadlines</h2>
        <p style={copyStyle}>
          SAR deadline reminders remain fixed at 14 days, 7 days,
          1 day and the due date. These are kept separate from
          general reminder preferences because they support a
          statutory response deadline.
        </p>

        <div style={fixedRowStyle}>
          {(settings?.sarDaysBefore ?? [14, 7, 1]).map((day) => (
            <span key={day} style={pillStyle}>
              {day} day{day === 1 ? "" : "s"} before
            </span>
          ))}
          <span style={pillStyle}>Due date</span>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "8px 4px 40px",
  color: "#2f2635",
};

const topRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "24px",
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#6e5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const titleStyle = {
  margin: "0 0 8px",
  fontSize: "36px",
  lineHeight: 1.08,
};

const subtitleStyle = {
  margin: 0,
  color: "#6d6371",
  lineHeight: 1.6,
};

const backLinkStyle = {
  color: "#6e5084",
  fontWeight: 800,
  textDecoration: "none",
};

const cardStyle = {
  marginBottom: "18px",
  padding: "24px",
  border: "1px solid #e7dced",
  borderRadius: "20px",
  background: "#fff",
  boxShadow: "0 14px 34px rgba(74,53,84,.06)",
};

const cardTitleStyle = {
  margin: "0 0 8px",
  fontSize: "20px",
};

const copyStyle = {
  margin: "0 0 20px",
  color: "#756a79",
  lineHeight: 1.6,
};

const presetGridStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginBottom: "18px",
};

const presetButtonStyle = {
  minHeight: "38px",
  padding: "8px 12px",
  border: "1px solid #d9cce2",
  borderRadius: "999px",
  background: "#fff",
  color: "#5d4370",
  font: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const activePresetButtonStyle = {
  background: "#f7f1fc",
  borderColor: "#9c7db4",
  boxShadow: "0 0 0 2px rgba(110,80,132,.08)",
};

const labelStyle = {
  display: "grid",
  gap: "8px",
  fontSize: "14px",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  minHeight: "46px",
  boxSizing: "border-box" as const,
  padding: "10px 13px",
  border: "1px solid #d9cce2",
  borderRadius: "12px",
  background: "#fff",
  color: "#2f2635",
  font: "inherit",
};

const helperStyle = {
  marginTop: "8px",
  color: "#756a79",
  fontSize: "12px",
  lineHeight: 1.5,
};

const previewStyle = {
  marginTop: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "#f7f1fc",
  color: "#5d4370",
  fontSize: "13px",
  lineHeight: 1.5,
};

const buttonStyle = {
  minHeight: "44px",
  marginTop: "18px",
  padding: "10px 16px",
  border: 0,
  borderRadius: "12px",
  background: "#6e5084",
  color: "#fff",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer",
};

const fixedRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const pillStyle = {
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#f5fff9",
  border: "1px solid #cde7da",
  color: "#356653",
  fontSize: "12px",
  fontWeight: 800,
};

const errorStyle = {
  marginBottom: "16px",
  padding: "12px 14px",
  border: "1px solid #e7b9bf",
  borderRadius: "12px",
  background: "#fff4f5",
  color: "#8c2f3d",
};

const successStyle = {
  marginBottom: "16px",
  padding: "12px 14px",
  border: "1px solid #b9dfcf",
  borderRadius: "12px",
  background: "#f3fff9",
  color: "#27674d",
};
