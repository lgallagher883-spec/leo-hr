import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function OtherDocumentsPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Other Document"
      title="Other Documents"
      singularLabel="Other Document"
      pluralLabel="Other Documents"
      description="Store and manage other organisation-wide documents that do not fit within the main document categories. Preview or download each document, or ask LEO to review it for clarity and areas requiring attention."
      iconLetter="O"
    />
  );
}
