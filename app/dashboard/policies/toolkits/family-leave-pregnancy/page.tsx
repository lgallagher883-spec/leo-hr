import PracticalToolkitPage from "@/components/resources/PracticalToolkitPage";

export default function FamilyLeavePregnancyToolkitPage() {
  return (
    <PracticalToolkitPage
      resourceId="family-leave-pregnancy"
      title="Family Leave & Pregnancy"
      summary="A practical employer pack for handling pregnancy, maternity and other statutory family leave consistently, including neonatal care and carer's leave."
      topic="Family leave"
      effectiveNote="Leave and pay eligibility are separate questions. Check current statutory rates, qualifying rules and notice requirements before confirming entitlement."
      related={[
        { label: "Flexible Working Guide", href: "/dashboard/policies/guides/managing-flexible-working-requests" },
        { label: "Annual Leave Factsheet", href: "/dashboard/policies/factsheets/annual-leave" },
      ]}
      sections={[
        {
          title: "Family-leave decision guide",
          bullets: [
            "Identify the leave requested: maternity, paternity, adoption, shared parental, parental, parental bereavement, neonatal care or carer's leave.",
            "Check the employee's eligibility for leave separately from eligibility for statutory pay.",
            "Record the expected or actual relevant dates and notice received.",
            "Confirm the leave arrangement in writing and explain any evidence requirements.",
            "Record statutory and contractual pay separately.",
            "Check annual-leave accrual, benefits and pension treatment during leave.",
            "Plan reasonable contact and return-to-work arrangements."
          ],
        },
        {
          title: "Pregnancy notification and support record",
          fields: [
            "Employee name and role",
            "Date pregnancy notified",
            "Expected week of childbirth / relevant date",
            "Health and safety risk-assessment action",
            "Antenatal appointment arrangements",
            "Adjustments or support agreed",
            "Maternity-leave start date if known",
            "Keeping-in-touch preferences",
          ],
        },
        {
          title: "Pregnancy workplace risk signposting",
          bullets: [
            "Review existing workplace risk assessments once notified in writing of pregnancy, recent birth or breastfeeding where relevant.",
            "Discuss risks with the employee and consider individual circumstances.",
            "Take action in the required order where a significant risk cannot be controlled: adjust conditions or hours, offer suitable alternative work, or consider paid suspension where the legal conditions are met.",
            "Review the assessment as the pregnancy progresses or circumstances change."
          ],
        },
        {
          title: "Leave request / confirmation template",
          fields: [
            "Type of family leave",
            "Request / notice received",
            "Relevant expected or actual date",
            "Leave start date",
            "Expected return date",
            "Statutory pay eligibility",
            "Contractual enhancement if any",
            "Evidence received",
            "Confirmation sent",
          ],
        },
        {
          title: "Neonatal care leave check",
          bullets: [
            "Confirm whether the baby received qualifying neonatal care within the statutory period.",
            "Check duration of qualifying care and available leave.",
            "Separate neonatal care leave entitlement from neonatal care pay eligibility.",
            "Record the tier / timing of leave and required notice.",
            "Avoid treating protected leave as an attendance or performance concern."
          ],
        },
        {
          title: "Return planning",
          fields: [
            "Confirmed return date",
            "Keeping-in-touch / SPLIT days used",
            "Annual leave to be taken before or after return",
            "Flexible working request if any",
            "Breastfeeding or expressing arrangements if relevant",
            "Phased return or adjustments",
            "Re-induction, systems or training needed",
          ],
        },
      ]}
    />
  );
}
