export type ProfessionalReasoningOutput = {
  hrIssues: string[];
  legalConsiderations: string[];
  businessConsiderations: string[];
  missingInformation: string[];
  recommendedApproach: string[];
  shouldAskQuestionsFirst: boolean;
};

export function buildProfessionalReasoning(input: string): ProfessionalReasoningOutput {
  const text = input.toLowerCase();

  const hrIssues: string[] = [];
  const legalConsiderations: string[] = [];
  const businessConsiderations: string[] = [];
  const missingInformation: string[] = [];
  const recommendedApproach: string[] = [];

  const mentionsBackProblem =
    text.includes("back") ||
    text.includes("back problem") ||
    text.includes("back pain");

  const mentionsHealth =
    mentionsBackProblem ||
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("condition") ||
    text.includes("illness") ||
    text.includes("disability");

  const mentionsHours =
    text.includes("hours") ||
    text.includes("working pattern") ||
    text.includes("shift") ||
    text.includes("part time") ||
    text.includes("full time");

  const mentionsShortNotice =
    text.includes("next week") ||
    text.includes("short notice") ||
    text.includes("immediately") ||
    text.includes("urgent");

  const mentionsBusinessNeed =
    text.includes("business needs") ||
    text.includes("business needs him") ||
    text.includes("needs him full time") ||
    text.includes("full time");

  if (mentionsHours) {
    hrIssues.push("This may involve a flexible working request or proposed change to working hours.");
  }

  if (mentionsHealth) {
    hrIssues.push("The employee has referred to a health issue, which may need to be considered separately from an ordinary flexible working request.");
    legalConsiderations.push("The employer should consider whether the health condition could amount to a disability under the Equality Act 2010.");
    legalConsiderations.push("If the condition may be a disability, the employer may need to consider reasonable adjustments before refusing the request.");
  }

  if (mentionsShortNotice) {
    businessConsiderations.push("The requested change appears to be on short notice, which may create operational pressure for the business.");
  }

  if (mentionsBusinessNeed) {
    businessConsiderations.push("The business has identified a need for the employee to remain full time, so any decision should balance operational requirements against the employee’s stated health position.");
  }

  if (mentionsHealth) {
    missingInformation.push("What is the nature of the back problem and how does it affect the employee’s ability to work their current hours?");
    missingInformation.push("Is the condition temporary, recurring, long-term, or likely to last 12 months or more?");
    missingInformation.push("Has the employee provided any medical evidence or requested an occupational health assessment?");
  }

  if (mentionsHours) {
    missingInformation.push("What exact change to hours is the employee requesting?");
    missingInformation.push("Is the request intended to be temporary or permanent?");
    missingInformation.push("Has the employee made a formal flexible working request?");
  }

  if (mentionsBusinessNeed) {
    missingInformation.push("What specific operational impact would the proposed change have on the business?");
    missingInformation.push("Could temporary cover, adjusted duties, different hours, or another compromise be considered?");
  }

  if (mentionsHealth || mentionsHours) {
    recommendedApproach.push("Do not refuse the request immediately.");
    recommendedApproach.push("Acknowledge the request and arrange a discussion with the employee.");
    recommendedApproach.push("Explore the medical position, the requested working pattern, and the operational impact.");
    recommendedApproach.push("Consider whether the matter should be treated as both a flexible working request and a potential reasonable adjustments issue.");
    recommendedApproach.push("Keep a clear written record of the discussion, evidence considered, and reasons for any decision.");
  }

  return {
    hrIssues,
    legalConsiderations,
    businessConsiderations,
    missingInformation,
    recommendedApproach,
    shouldAskQuestionsFirst: missingInformation.length > 0,
  };
}