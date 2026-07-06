export type IntentType =
  | "hr_query"
  | "policy_question"
  | "employee_issue"
  | "disciplinary"
  | "grievance"
  | "absence"
  | "redundancy"
  | "contract"
  | "pay"
  | "termination"
  | "general_workplace"
  | "non_workplace";

export function detectIntent(message: string): IntentType {
  const text = message.toLowerCase();

  // 🚫 Non-workplace filter (hard boundary rule)
  const nonWorkplaceSignals = [
    "poem",
    "joke",
    "weather",
    "capital of",
    "sports",
    "movie",
    "game",
    "music"
  ];

  if (nonWorkplaceSignals.some((word) => text.includes(word))) {
    return "non_workplace";
  }

  // HR classification rules
  if (text.includes("grievance")) return "grievance";
  if (text.includes("dismiss") || text.includes("fired")) return "termination";
  if (text.includes("disciplin")) return "disciplinary";
  if (text.includes("redund")) return "redundancy";
  if (text.includes("absence") || text.includes("sick")) return "absence";
  if (text.includes("contract")) return "contract";
  if (text.includes("pay") || text.includes("salary")) return "pay";

  return "hr_query";
}