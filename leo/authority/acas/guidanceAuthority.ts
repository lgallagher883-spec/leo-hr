import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

type GuidanceArea = {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  recommendation: string;
};

const ACAS_GUIDANCE_AREAS: GuidanceArea[] = [
  {
    id: "acas-absence-guidance",
    title: "ACAS Guidance on Managing Absence",
    summary:
      "ACAS guidance supports fair, consistent and supportive management of sickness absence, including accurate records, welfare contact, return-to-work discussions and consideration of disability.",
    topics: [
      "absence",
      "absent",
      "sick",
      "sickness",
      "fit note",
      "return to work",
      "long term absence",
      "short term absence",
      "attendance",
      "occupational health",
    ],
    recommendation:
      "Review the absence history, maintain appropriate contact, establish the medical position and consider support or adjustments before formal action.",
  },
  {
    id: "acas-reasonable-adjustments-guidance",
    title: "ACAS Guidance on Reasonable Adjustments",
    summary:
      "ACAS guidance explains that reasonable adjustments should be explored collaboratively and tailored to the individual disadvantage experienced by a disabled worker.",
    topics: [
      "disability",
      "disabled",
      "reasonable adjustment",
      "reasonable adjustments",
      "mental health",
      "depression",
      "anxiety",
      "health condition",
      "working from home",
      "home working",
    ],
    recommendation:
      "Discuss the disadvantage and proposed adjustment with the employee, consider medical evidence where useful and assess reasonable alternatives before deciding.",
  },
  {
    id: "acas-investigation-guidance",
    title: "ACAS Guidance on Workplace Investigations",
    summary:
      "ACAS guidance supports prompt, impartial and proportionate fact-finding before disciplinary or grievance conclusions are reached.",
    topics: [
      "investigation",
      "investigate",
      "allegation",
      "witness",
      "evidence",
      "fact finding",
      "disciplinary",
      "grievance",
      "misconduct",
    ],
    recommendation:
      "Define the issues clearly, appoint an impartial investigator, gather relevant evidence and give the employee a fair opportunity to respond.",
  },
  {
    id: "acas-performance-capability-guidance",
    title: "ACAS Guidance on Performance and Capability",
    summary:
      "ACAS guidance supports clear standards, suitable support, reasonable opportunities to improve and careful consideration of disability or health before capability action.",
    topics: [
      "performance",
      "underperformance",
      "capability",
      "poor performance",
      "performance improvement plan",
      "not meeting standards",
      "unable to perform",
    ],
    recommendation:
      "Clarify the required standard, identify causes, provide appropriate support and allow a reasonable improvement period before considering formal outcomes.",
  },
  {
    id: "acas-redundancy-guidance",
    title: "ACAS Guidance on Managing Redundancy",
    summary:
      "ACAS guidance supports genuine and meaningful consultation, fair selection, consideration of alternatives and proper handling of suitable alternative employment.",
    topics: [
      "redundancy",
      "redundant",
      "role at risk",
      "selection pool",
      "selection criteria",
      "consultation",
      "collective consultation",
      "suitable alternative employment",
      "restructure",
    ],
    recommendation:
      "Consult while proposals remain open, consider alternatives, use objective selection criteria and search for suitable alternative employment.",
  },
  {
    id: "acas-tupe-guidance",
    title: "ACAS Guidance on TUPE",
    summary:
      "ACAS guidance explains the need to plan transfers carefully, identify affected employees, exchange employee liability information and inform and consult appropriately.",
    topics: [
      "tupe",
      "business transfer",
      "service provision change",
      "outsourcing",
      "insourcing",
      "employee liability information",
      "transfer of employees",
    ],
    recommendation:
      "Confirm whether TUPE applies, identify affected employees, plan information and consultation and review proposed measures before the transfer.",
  },
  {
    id: "acas-whistleblowing-guidance",
    title: "ACAS Guidance on Whistleblowing",
    summary:
      "ACAS guidance supports prompt, confidential and impartial handling of disclosures, protection from retaliation and appropriate investigation of the reported wrongdoing.",
    topics: [
      "whistleblowing",
      "whistleblower",
      "protected disclosure",
      "public interest disclosure",
      "reported wrongdoing",
      "retaliation",
      "victimised for speaking up",
    ],
    recommendation:
      "Assess whether the concern may be a protected disclosure, investigate the wrongdoing independently and protect the worker from retaliation.",
  },
  {
    id: "acas-bullying-discrimination-guidance",
    title: "ACAS Guidance on Bullying and Discrimination Complaints",
    summary:
      "ACAS guidance supports taking complaints seriously, deciding whether informal or formal handling is appropriate and investigating serious allegations fairly.",
    topics: [
      "bullying",
      "bullied",
      "discrimination",
      "harassment",
      "victimisation",
      "unfair treatment",
      "hostile environment",
      "formal complaint",
    ],
    recommendation:
      "Clarify the complaint, assess whether immediate protection is required and use an impartial formal process where the allegations are serious or disputed.",
  },
];

function normaliseAuthorityContext(
  input: AuthorityEngineInput
): string {
  return JSON.stringify({
    message: input.message,
    intent: input.intent,
    classification: input.classification,
    triggerOutput: input.triggerOutput,
    professionalReasoning: input.professionalReasoning,
  }).toLowerCase();
}

export function runAcasGuidanceAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context = normaliseAuthorityContext(input);

  return ACAS_GUIDANCE_AREAS.flatMap(
    (guidance): AuthorityReference[] => {
      const matchedTopics = guidance.topics.filter((topic) =>
        context.includes(topic)
      );

      if (matchedTopics.length === 0) {
        return [];
      }

      return [
        {
          id: guidance.id,
          sourceType: "acas_guidance",
          authorityLevel: "authoritative_guidance",
          title: guidance.title,
          summary: guidance.summary,
          relevance: `Relevant topics identified: ${matchedTopics.join(
            ", "
          )}. ${guidance.recommendation}`,
          status: "applicable",
          confidence: "high",
          mandatory: false,
          sourceVersion:
            "Current published ACAS guidance must be checked",
          retrievedAt: new Date().toISOString(),
        },
      ];
    }
  );
}