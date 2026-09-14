export type DocumentClassification = {
  category: "right_to_work" | "dbs" | "driving" | "fit_note" | "qualification" | "contract" | "policy_acknowledgement" | "other";
  confidence: "high" | "medium" | "low";
  sensitive: boolean;
  canAdvanceWorkflow: boolean;
  requiresHumanVerification: boolean;
  reason: string;
};

function normalise(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function classifyEmployeeDocument(input: {
  title?: unknown;
  documentType?: unknown;
  fileName?: unknown;
  notes?: unknown;
  contentText?: unknown;
}): DocumentClassification {
  const haystack = [
    normalise(input.title),
    normalise(input.documentType),
    normalise(input.fileName),
    normalise(input.notes),
    normalise(input.contentText).slice(0, 50_000),
  ].join(" ");

  if (haystack.includes("right to work") || haystack.includes("passport") || haystack.includes("visa")) {
    return { category: "right_to_work", confidence: "high", sensitive: true, canAdvanceWorkflow: false, requiresHumanVerification: true, reason: "Identity evidence can be filed automatically, but receiving it does not itself verify right to work." };
  }
  if (haystack.includes("dbs") || haystack.includes("disclosure") || haystack.includes("safeguard")) {
    return { category: "dbs", confidence: "high", sensitive: true, canAdvanceWorkflow: false, requiresHumanVerification: true, reason: "DBS evidence can be filed automatically, but suitability and verification remain human-controlled." };
  }
  if (haystack.includes("driving") || haystack.includes("licence") || haystack.includes("license")) {
    return { category: "driving", confidence: "high", sensitive: true, canAdvanceWorkflow: false, requiresHumanVerification: true, reason: "Driving evidence can be filed automatically but must not be treated as verified solely because a file exists." };
  }
  if (haystack.includes("fit note") || haystack.includes("medical certificate")) {
    return { category: "fit_note", confidence: "high", sensitive: true, canAdvanceWorkflow: true, requiresHumanVerification: false, reason: "The document can be linked to absence administration without making a medical judgement." };
  }
  if (haystack.includes("qualification") || haystack.includes("certificate") || haystack.includes("registration")) {
    return { category: "qualification", confidence: "medium", sensitive: false, canAdvanceWorkflow: false, requiresHumanVerification: true, reason: "Qualification evidence can be filed, while equivalence or validity may still require verification." };
  }
  if (haystack.includes("contract") || haystack.includes("written particulars") || haystack.includes("statement of terms")) {
    return { category: "contract", confidence: "high", sensitive: false, canAdvanceWorkflow: true, requiresHumanVerification: false, reason: "Employment documents can be linked to the employee record and dependent administrative workflow." };
  }
  if (haystack.includes("acknowledgement") || haystack.includes("acknowledgment") || haystack.includes("policy signed")) {
    return { category: "policy_acknowledgement", confidence: "medium", sensitive: false, canAdvanceWorkflow: true, requiresHumanVerification: false, reason: "A clearly identified acknowledgement can advance the matching administrative workflow." };
  }
  return { category: "other", confidence: "low", sensitive: false, canAdvanceWorkflow: false, requiresHumanVerification: true, reason: "Leo cannot safely determine the document workflow from the available metadata." };
}

export function documentWorkflowLabel(classification: DocumentClassification): string {
  const labels: Record<DocumentClassification["category"], string> = {
    right_to_work: "Right to Work evidence",
    dbs: "DBS evidence",
    driving: "Driving evidence",
    fit_note: "Fit note",
    qualification: "Qualification evidence",
    contract: "Employment contract",
    policy_acknowledgement: "Policy acknowledgement",
    other: "Employee document",
  };
  return labels[classification.category];
}
