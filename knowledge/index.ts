export type KnowledgeArticle = {
  intent: string;
  title: string;
  summary: string;
  nextStep: string;
};

const knowledge: Record<string, KnowledgeArticle> = {
  flexible_working: {
    intent: "flexible_working",
    title: "Flexible Working",
    summary:
      "A request to change working arrangements should be assessed carefully, taking account of company policy, the statutory framework and the operational needs of the business.",
    nextStep:
      "Clarify whether the employee is making an informal enquiry or a formal flexible working request before deciding how to respond.",
  },

  grievance: {
    intent: "grievance",
    title: "Grievance",
    summary:
      "Employee concerns should be handled fairly, consistently and in accordance with the organisation's grievance procedure.",
    nextStep:
      "Acknowledge the grievance, review the relevant policy and consider whether an investigation is required.",
  },

  disciplinary: {
    intent: "disciplinary",
    title: "Disciplinary",
    summary:
      "Potential misconduct should be investigated before deciding whether formal disciplinary action is appropriate.",
    nextStep:
      "Establish the facts, gather evidence and follow the disciplinary procedure.",
  },

  absence: {
    intent: "absence",
    title: "Absence",
    summary:
      "Absence matters should be considered alongside the reason for absence, the employee's wellbeing and the organisation's attendance procedures.",
    nextStep:
      "Review the attendance record, consider any support required and follow the absence policy.",
  },
};

export function getKnowledge(intent: string): KnowledgeArticle | null {
  return knowledge[intent] ?? null;
}