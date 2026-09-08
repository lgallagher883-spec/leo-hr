import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function RiskAssessmentsPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Risk Assessment"
      title="Risk Assessments"
      singularLabel="Risk Assessment"
      pluralLabel="Risk Assessments"
      description="Store and manage your organisation's risk assessments and review records. Preview or download each document, or ask LEO to review it for outdated content, missing safeguards and areas requiring attention."
      iconLetter="R"
    />
  );
}
