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
  | "flexible_working"
  | "general_workplace"
  | "non_workplace";

export function detectIntent(message: string): IntentType {
  const text = message.toLowerCase();

  const nonWorkplaceSignals = [
    "poem",
    "tell me a joke",
    "know any jokes",
    "weather",
    "capital of",
    "sports",
    "movie",
    "game",
    "music",
  ];

  if (nonWorkplaceSignals.some((word) => text.includes(word))) {
    return "non_workplace";
  }

  if (text.includes("grievance")) return "grievance";

  if (text.includes("dismiss") || text.includes("fired"))
    return "termination";

  if (
    text.includes("disciplin") ||
    text.includes("misconduct") ||
    text.includes("theft") ||
    text.includes("stealing") ||
    text.includes("stole") ||
    text.includes("cctv") ||
    text.includes("shoplifting")
  )
    return "disciplinary";

  if (text.includes("redund"))
    return "redundancy";

  if (
    text.includes("absence") ||
    text.includes("sick") ||
    text.includes("bereavement")
  )
    return "absence";

  if (
    text.includes("flexible") ||
    text.includes("working pattern") ||
    text.includes("change my hours") ||
    text.includes("change his hours") ||
    text.includes("change her hours") ||
    text.includes("change their hours") ||
    text.includes("hours change")
  ) {
    return "flexible_working";
  }

  if (text.includes("contract")) return "contract";

  if (text.includes("pay") || text.includes("salary")) return "pay";

  return "hr_query";
}