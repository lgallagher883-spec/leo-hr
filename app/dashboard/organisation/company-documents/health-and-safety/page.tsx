import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function HealthAndSafetyPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Health & Safety"
      title="Health & Safety"
      singularLabel="Health & Safety Document"
      pluralLabel="Health & Safety Documents"
      description="Store and manage your organisation's health and safety documentation. Preview or download each document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="H"
    />
  );
}
