import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function TemplatesPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Template"
      title="Templates"
      singularLabel="Template"
      pluralLabel="Templates"
      description="Store and manage reusable internal document templates for your organisation. Preview or download each document, or ask LEO to review it for clarity, consistency and areas requiring attention."
      iconLetter="T"
    />
  );
}
