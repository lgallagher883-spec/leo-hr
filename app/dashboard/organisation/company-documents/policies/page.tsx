import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function PoliciesPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Policy"
      title="Policies"
      singularLabel="Policy"
      pluralLabel="Policies"
      description="Keep your organisation's policies together in one clear, alphabetical library. Preview or download each document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="P"
    />
  );
}