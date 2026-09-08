import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function ProceduresPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Procedure"
      title="Procedures"
      singularLabel="Procedure"
      pluralLabel="Procedures"
      description="Store and manage your organisation's operational procedures. Preview or download each document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="P"
    />
  );
}
