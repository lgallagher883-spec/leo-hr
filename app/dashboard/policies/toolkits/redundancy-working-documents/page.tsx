import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function RedundancyWorkingDocumentsToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="redundancy-working-documents"
      title="Redundancy Working Documents"
      summary="Practical working documents for consultation, selection, alternative roles and transparent redundancy decisions."
      topic="Redundancy"
      related={[
        { label: "Managing Redundancy", href: "/dashboard/policies/guides/managing-redundancy" },
        { label: "Redundancy Consultation Checklist", href: "/dashboard/policies/checklists/redundancy-consultation-checklist" },
      ]}
      sections={[
        {
          title: "Policy and document check before consultation",
          bullets: [
            "Redundancy / organisational change policy.",
            "Employment contracts and any contractual redundancy scheme.",
            "Equality, family leave and reasonable-adjustment policies.",
            "Collective agreement or recognised trade union arrangements where applicable.",
            "Selection criteria and evidence sources.",
            "Vacancy and alternative-employment records."
          ],
        },
        {
          title: "Consultation meeting record",
          fields: [
            "Business proposal explained",
            "Employee questions and representations",
            "Alternatives suggested",
            "Employer response / further investigation required",
            "Selection information discussed",
            "Vacancies / alternative roles discussed",
            "Next steps and next consultation date",
          ],
        },
        {
          title: "Selection criteria and scoring rationale",
          paragraphs: ["Use objective, relevant criteria capable of being evidenced. Avoid criteria that directly or indirectly disadvantage protected groups unless objectively justified."],
          fields: [
            "Selection pool and rationale",
            "Criterion",
            "Weighting",
            "Scoring scale",
            "Evidence source",
            "Employee score",
            "Reason / evidence for score",
            "Moderation or consistency check",
          ],
        },
        {
          title: "Alternative-role assessment",
          fields: [
            "Vacancy / role",
            "Employee considered",
            "Skills and requirements match",
            "Training required",
            "Pay / hours / location differences",
            "Suitable alternative employment assessment",
            "Employee response",
            "Decision and reasons",
          ],
        },
        {
          title: "Final decision record",
          fields: [
            "Consultation undertaken",
            "Representations considered and response",
            "Selection outcome and evidence",
            "Alternatives considered",
            "Suitable alternative employment considered",
            "Notice and termination date",
            "Redundancy pay calculation checked",
            "Appeal / review route if offered under policy",
          ],
        },
      ]}
    />
  );
}
