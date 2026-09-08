import CompanyDocumentsLibrary from "../components/CompanyDocumentsLibrary";

export default function OfferLettersPage() {
  return (
    <CompanyDocumentsLibrary
      folder="Offer Letter"
      title="Offer Letters"
      singularLabel="Offer Letter"
      pluralLabel="Offer Letters"
      description="Store and manage your organisation's offer letter templates. Preview or download each document, or ask LEO to review it for outdated wording, legal changes and areas requiring attention."
      iconLetter="O"
    />
  );
}
