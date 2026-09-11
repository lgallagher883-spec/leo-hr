import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function SexualHarassmentPreventionToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="sexual-harassment-prevention"
      title="Sexual Harassment Prevention"
      summary="A prevention-first employer pack covering risk assessment, preventative action, reporting routes, manager response and training records."
      topic="Disciplinary"
      effectiveNote="Employers already have a statutory duty to take reasonable steps to prevent sexual harassment. The Employment Rights Act 2025 strengthens this to an all-reasonable-steps duty from 30 October 2026."
      related={[
        { label: "Disciplinary Toolkit", href: "/dashboard/policies/toolkits/disciplinary-toolkit" },
        { label: "Conducting Workplace Investigations", href: "/dashboard/policies/guides/conducting-workplace-investigations" },
      ]}
      sections={[
        {
          title: "Workplace sexual-harassment risk assessment",
          paragraphs: ["Assess the actual working environment, not only whether a policy exists. Review risks periodically and when the workforce, work location or customer environment changes."],
          fields: [
            "Area, role or activity assessed",
            "Potential source of risk, including customers, clients, contractors or colleagues",
            "Who could be affected",
            "Existing controls",
            "Further preventative steps required",
            "Owner and target date",
            "Review date",
          ],
        },
        {
          title: "Common risk factors to consider",
          bullets: [
            "Lone working, night work, travel, social events or alcohol-related work functions.",
            "Power imbalances, junior staff, temporary staff, apprentices or isolated workers.",
            "Customer-facing work and third-party harassment risks.",
            "Informal messaging channels, social media or blurred personal/work boundaries.",
            "Previous complaints, staff survey themes or known conduct concerns.",
            "Inadequate reporting routes or managers who have not been trained to respond."
          ],
        },
        {
          title: "Prevention action plan",
          fields: [
            "Risk or issue",
            "Preventative action",
            "Responsible person",
            "Target completion date",
            "Evidence of completion",
            "Effectiveness review",
          ],
        },
        {
          title: "Reporting routes",
          bullets: [
            "Provide more than one reporting route where possible.",
            "Explain how to report concerns involving the employee's manager.",
            "Allow early informal reporting without forcing an immediate formal complaint.",
            "Explain confidentiality limits and how information may need to be shared.",
            "Protect complainants and witnesses from victimisation or retaliation."
          ],
        },
        {
          title: "Manager response checklist",
          bullets: [
            "Listen without minimising, challenging or making promises about the outcome.",
            "Check immediate safety and wellbeing needs.",
            "Record the concern accurately in the employee's own terms.",
            "Explain available informal and formal routes.",
            "Consider temporary protective measures without prejudging the facts.",
            "Escalate promptly to the appropriate decision-maker.",
            "Preserve relevant messages, CCTV, documents or witness details.",
            "Keep the complainant informed and monitor for retaliation."
          ],
        },
        {
          title: "Training and prevention record",
          fields: [
            "Training or briefing delivered",
            "Audience / attendees",
            "Date",
            "Trainer",
            "Key topics covered",
            "Follow-up actions",
            "Next refresher date",
          ],
        },
      ]}
    />
  );
}
