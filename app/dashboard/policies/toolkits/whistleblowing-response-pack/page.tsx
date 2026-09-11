import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function WhistleblowingResponseToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="whistleblowing-response-pack"
      title="Whistleblowing Response Pack"
      summary="A manager pack for recognising protected disclosures, routing them correctly, investigating appropriately and preventing detriment."
      topic="Grievance"
      related={[
        { label: "Managing a Grievance", href: "/dashboard/policies/guides/managing-a-grievance" },
        { label: "Conducting Workplace Investigations", href: "/dashboard/policies/guides/conducting-workplace-investigations" },
      ]}
      sections={[
        {
          title: "Recognition and routing guide",
          bullets: [
            "Focus on the substance of the concern rather than whether the employee uses the word whistleblowing.",
            "Consider whether the disclosure appears to concern wrongdoing in the public interest, such as legal breaches, health and safety danger, environmental damage, miscarriages of justice or concealment.",
            "A concern may contain both a personal grievance and a whistleblowing disclosure; route each element appropriately.",
            "Escalate concerns involving senior leaders to an independent route where possible.",
            "Do not require the worker to prove the wrongdoing before the concern is considered."
          ],
        },
        {
          title: "Acknowledgement template",
          fields: [
            "Date concern received",
            "Person receiving concern",
            "Summary of issues raised",
            "How the concern will be handled",
            "Confidentiality explanation",
            "Expected next update",
            "Contact for further information",
          ],
        },
        {
          title: "Investigation remit",
          fields: [
            "Issues to be investigated",
            "Issues outside scope and why",
            "Investigator and independence check",
            "Evidence sources",
            "Witnesses",
            "Timescale",
            "Reporting / decision-maker",
            "Required interim safeguards",
          ],
        },
        {
          title: "Confidentiality and detriment safeguards",
          bullets: [
            "Limit disclosure of identity and information to those who genuinely need it.",
            "Do not promise absolute confidentiality where it cannot be guaranteed.",
            "Monitor for retaliation, exclusion, reduced opportunities, hostile treatment or other detriment.",
            "Keep employment decisions affecting the whistleblower demonstrably evidence-based.",
            "Record the reasons for any action that could otherwise appear retaliatory."
          ],
        },
        {
          title: "Follow-up record",
          fields: [
            "Action taken",
            "Findings communicated to the extent appropriate",
            "Control / process improvements",
            "Safeguards for the worker",
            "Retaliation check",
            "Further review date",
          ],
        },
      ]}
    />
  );
}
