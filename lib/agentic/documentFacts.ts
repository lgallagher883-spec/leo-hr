export type ExtractedDocumentFact = {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium";
};

function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1] ? tidy(match[1]) : "";
    if (value) return value;
  }
  return null;
}

function labelledDate(text: string, labels: string[]): string | null {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return firstMatch(text, [
    new RegExp(`(?:${escaped.join("|")})\\s*[:\\-]?\\s*(\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4})`, "i"),
    new RegExp(`(?:${escaped.join("|")})\\s*[:\\-]?\\s*(\\d{1,2}\\s+[A-Za-z]+\\s+\\d{4})`, "i"),
  ]);
}

export function extractDocumentFacts(args: {
  category: string;
  text: string;
}): ExtractedDocumentFact[] {
  const text = args.text.slice(0, 50_000);
  if (!text.trim()) return [];

  const facts: ExtractedDocumentFact[] = [];
  const push = (key: string, label: string, value: string | null, confidence: "high" | "medium" = "high") => {
    if (!value || facts.some((fact) => fact.key === key)) return;
    facts.push({ key, label, value, confidence });
  };

  if (args.category === "right_to_work") {
    push("document_expiry", "Document expiry", labelledDate(text, ["passport expiry", "date of expiry", "expiry date", "expires"]));
    push("passport_number", "Passport number", firstMatch(text, [/passport\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9]{6,15})/i]), "medium");
  }

  if (args.category === "dbs") {
    push("certificate_number", "Certificate number", firstMatch(text, [/certificate\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9\-]{5,30})/i]));
    push("certificate_issue_date", "Certificate issue date", labelledDate(text, ["certificate issue date", "date of issue", "issue date"]));
  }

  if (args.category === "driving") {
    push("licence_expiry", "Licence expiry", labelledDate(text, ["licence expiry", "license expiry", "date of expiry", "valid to"]));
    push("licence_number", "Licence number", firstMatch(text, [/(?:driving\s*)?(?:licence|license)\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9]{8,24})/i]), "medium");
  }

  if (args.category === "fit_note") {
    push("fit_note_from", "Fit note from", labelledDate(text, ["from", "start date", "date from"]), "medium");
    push("fit_note_until", "Fit note until", labelledDate(text, ["until", "to", "end date", "date to"]), "medium");
  }

  if (args.category === "qualification") {
    push("qualification_expiry", "Qualification expiry", labelledDate(text, ["expiry date", "valid until", "renewal date"]), "medium");
    push("certificate_number", "Certificate number", firstMatch(text, [/certificate\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9\-]{5,30})/i]), "medium");
  }

  return facts;
}