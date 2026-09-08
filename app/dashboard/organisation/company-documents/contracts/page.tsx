import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function ContractsPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Contract"
      title="Contracts"
      singularLabel="Contract"
      pluralLabel="Contracts"
      description="Store and manage your organisation's contract templates and other organisation-wide contractual documents. Preview or download each document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="C"
    />
  );
}
