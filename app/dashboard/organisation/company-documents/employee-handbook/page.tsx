import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function EmployeeHandbookPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Employee Handbook"
      title="Employee Handbook"
      singularLabel="Employee Handbook"
      pluralLabel="Employee Handbooks"
      description="Store and manage your organisation's current employee handbook. Preview or download the document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="H"
    />
  );
}
