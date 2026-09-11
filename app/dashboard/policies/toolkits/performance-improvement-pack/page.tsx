import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function PerformanceImprovementToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="performance-improvement-pack"
      title="Performance Improvement Pack"
      summary="A structured pack for setting measurable improvement objectives, support, review dates and evidence-based outcomes."
      topic="Performance"
      related={[
        { label: "Performance Management Guide", href: "/dashboard/policies/guides/performance-management" },
        { label: "Performance Improvement Meeting Letter", href: "/dashboard/policies/letters/performance-improvement-meeting" },
      ]}
      sections={[
        {
          title: "Before starting a formal improvement plan",
          bullets: [
            "Define the required standard and the evidence showing the gap.",
            "Check whether expectations, training, workload or resources contributed.",
            "Consider disability, health, language, literacy or other adjustment needs.",
            "Confirm whether the issue is capability, conduct or both.",
            "Check the organisation's capability/performance policy and any contractual process."
          ],
        },
        {
          title: "Performance improvement plan",
          fields: [
            "Performance concern",
            "Required standard / measurable objective",
            "Evidence or measure of success",
            "Support, training or resources provided",
            "Employee comments",
            "Review period",
            "Interim review dates",
            "Consequence if sufficient improvement is not achieved",
          ],
        },
        {
          title: "Review meeting record",
          fields: [
            "Objective reviewed",
            "Evidence considered",
            "Progress achieved",
            "Employee explanation",
            "Support already provided",
            "Further support or adjustment",
            "Decision and reasons",
            "Next review / outcome date",
          ],
        },
        {
          title: "Outcome options",
          bullets: [
            "Close the plan where the required standard has been achieved and record the improvement.",
            "Continue or extend only where there is a fair, evidenced reason and a realistic prospect of improvement.",
            "Move to the next formal capability stage in line with policy where improvement is insufficient.",
            "Do not predetermine dismissal; review all evidence, explanations, mitigation and alternatives."
          ],
        },
      ]}
    />
  );
}
