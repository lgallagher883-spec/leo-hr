import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function CompanyFormsPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Company Form"
      title="Company Forms"
      singularLabel="Company Form"
      pluralLabel="Company Forms"
      description="Store and manage forms created for use within your organisation. Preview or download each document, or ask LEO to review it for clarity, relevance and areas requiring attention."
      iconLetter="F"
    />
  );
}
