import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function ReasonableAdjustmentsToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="reasonable-adjustments-disability-support"
      title="Reasonable Adjustments & Disability Support"
      summary="A practical employer pack for identifying, agreeing, recording and reviewing reasonable adjustments with disabled employees."
      topic="Sickness & absence"
      effectiveNote="The duty to make reasonable adjustments depends on the individual circumstances. Avoid requiring an employee to disclose more medical information than is necessary to understand workplace impact and support."
      related={[
        { label: "Managing Sickness Absence", href: "/dashboard/policies/guides/managing-sickness-absence" },
        { label: "Sickness Absence Review Checklist", href: "/dashboard/policies/checklists/sickness-absence-review-checklist" },
      ]}
      sections={[
        {
          title: "Manager conversation guide",
          paragraphs: ["Use a supportive, practical conversation focused on barriers at work and what could reduce or remove them. Do not require the employee to suggest the final solution themselves."],
          bullets: [
            "Explain the purpose of the discussion and confirm confidentiality.",
            "Ask what aspects of the job or workplace create difficulty.",
            "Explore adjustments to hours, duties, equipment, location, communication, supervision or procedures.",
            "Ask what has helped previously and whether specialist input may be useful.",
            "Agree what will be tried, who is responsible and when it will be reviewed.",
            "Record reasons where a requested adjustment cannot reasonably be implemented and consider alternatives."
          ],
        },
        {
          title: "Workplace adjustments passport / agreement",
          fields: [
            "Employee name, role and manager",
            "Workplace barriers identified",
            "Adjustment agreed",
            "How the adjustment will work in practice",
            "Equipment, funding or external support required",
            "Who is responsible for implementation",
            "Start date and review date",
            "What the employee should do if the adjustment stops being effective",
          ],
        },
        {
          title: "Adjustment review record",
          fields: [
            "Adjustment being reviewed",
            "What is working well",
            "What is not working or has changed",
            "Employee feedback",
            "Manager observations",
            "Changes agreed",
            "Next review date",
          ],
        },
        {
          title: "Occupational health referral checklist",
          bullets: [
            "Explain the purpose of the referral and obtain any required consent.",
            "Provide an accurate role description and the workplace issues requiring advice.",
            "Ask functional questions rather than seeking a diagnosis for its own sake.",
            "Ask about likely workplace impact, adjustments, duration and review points.",
            "Treat occupational health advice as evidence to consider, not an automatic decision.",
            "Discuss the report with the employee before deciding next steps."
          ],
        },
        {
          title: "Examples to consider",
          bullets: [
            "Adjusted start and finish times or additional breaks.",
            "Temporary or permanent changes to duties or workload.",
            "Home or hybrid working where appropriate.",
            "Specialist equipment, software or workstation changes.",
            "Written instructions, quieter workspace or communication changes.",
            "Additional supervision, mentoring or phased return arrangements.",
            "Changes to absence-management triggers where disability-related absence is relevant."
          ],
        },
      ]}
    />
  );
}
