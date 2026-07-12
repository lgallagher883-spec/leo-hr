export interface StoredPolicy {
  id: string;

  organisationId?: string;

  title: string;

  category:
    | "disciplinary"
    | "grievance"
    | "absence"
    | "capability"
    | "recruitment"
    | "flexible_working"
    | "family_leave"
    | "equality"
    | "health_and_safety"
    | "general";

  summary: string;

  keywords: string[];

  sections: StoredPolicySection[];

  uploadedAt?: string;

  updatedAt?: string;

  active: boolean;
}

export interface StoredPolicySection {
  id: string;

  heading: string;

  content: string;

  keywords: string[];
}

export interface PolicySearchMatch {
  policyId: string;

  policyTitle: string;

  sectionId: string;

  sectionHeading: string;

  relevance: string;

  confidence: "low" | "medium" | "high";
}

export function searchStoredPolicies(
  message: string,
  policies: StoredPolicy[] = []
): PolicySearchMatch[] {
  const query = message.toLowerCase();

  const matches: PolicySearchMatch[] = [];

  for (const policy of policies) {
    if (!policy.active) continue;

    for (const section of policy.sections) {
      const searchable = [
        policy.title,
        section.heading,
        section.content,
        ...policy.keywords,
        ...section.keywords,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(query) && !policy.keywords.some(k => query.includes(k.toLowerCase()))) {
        continue;
      }

      matches.push({
        policyId: policy.id,
        policyTitle: policy.title,
        sectionId: section.id,
        sectionHeading: section.heading,
        relevance:
          "This policy section appears relevant to the employer's question.",
        confidence: "high",
      });
    }
  }

  return matches;
}