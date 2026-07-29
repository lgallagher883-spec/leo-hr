"use client";

import Link from "next/link";

type Props = {
  organisationId: string;
};

const folders = [
  {
    title: "Policies",
    description:
      "Manage the organisation's approved and working policy documents.",
    href: "/dashboard/organisation/company-documents/policies",
    available: true,
  },
  {
    title: "Procedures",
    description: "Store the organisation's operational procedures.",
    available: false,
  },
  {
    title: "Employee Handbook",
    description: "Hold the organisation's current employee handbook.",
    available: false,
  },
  {
    title: "Contracts",
    description: "Store organisation-wide contract templates.",
    available: false,
  },
  {
    title: "Offer Letters",
    description: "Keep the organisation's offer letter templates.",
    available: false,
  },
  {
    title: "Company Forms",
    description: "Manage forms created for use within the organisation.",
    available: false,
  },
  {
    title: "Risk Assessments",
    description: "Store organisational risk assessments and reviews.",
    available: false,
  },
  {
    title: "Health & Safety",
    description: "Keep health and safety documentation together.",
    available: false,
  },
  {
    title: "Templates",
    description: "Store reusable internal document templates.",
    available: false,
  },
  {
    title: "Other Documents",
    description: "Hold other organisation-wide documents.",
    available: false,
  },
];

export default function CompanyDocumentsWorkspace({
  organisationId,
}: Props) {
  return (
    <div className="company-documents">
      <header className="hero">
        <div>
          <p className="eyebrow">Organisation</p>
          <h2>Company Documents</h2>
          <p>
            Store and manage your organisation&apos;s own documents. These are
            separate from LEO HR Resources and belong exclusively to your
            organisation.
          </p>
        </div>

        <span className="organisation-reference" title={organisationId}>
          Organisation library
        </span>
      </header>

      <div className="folders">
        {folders.map((folder) =>
          folder.available && folder.href ? (
            <Link className="company-document-card" href={folder.href} key={folder.title}>
              <span className="folder-icon" aria-hidden="true">
                ▢
              </span>
              <div>
                <h3>{folder.title}</h3>
                <p>{folder.description}</p>
                <span className="open-label">Open documents →</span>
              </div>
            </Link>
          ) : (
            <div className="company-document-card" key={folder.title}>
              <span className="folder-icon" aria-hidden="true">
                ▢
              </span>
              <div>
                <h3>{folder.title}</h3>
                <p>{folder.description}</p>
                <span className="empty-label">No documents added</span>
              </div>
            </div>
          ),
        )}
      </div>

      <style jsx>{`
        .company-documents {
          min-width: 0;
        }

        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 7px;
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0 0 8px;
          color: #6e5084;
          font-size: 30px;
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .hero p:not(.eyebrow) {
          max-width: 760px;
          margin: 0;
          color: #64748b;
          line-height: 1.65;
        }

        .organisation-reference {
          flex: 0 0 auto;
          padding: 8px 11px;
          border-radius: 999px;
          background: #f7f1fc;
          color: #6e5084;
          font-size: 12px;
          font-weight: 700;
        }

        .folders {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
          gap: 16px;
        }

        :global(.company-document-card) {
          display: flex;
          gap: 14px;
          min-height: 150px;
          box-sizing: border-box;
          padding: 20px;
          border: 1px solid #e5dce8;
          border-radius: 17px;
          background: #ffffff;
          color: #334155;
          text-decoration: none;
        }

        :global(a.company-document-card) {
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        :global(a.company-document-card:hover) {
          transform: translateY(-2px);
          border-color: #cdb2e2;
          background: #fcfafc;
          box-shadow: 0 12px 28px rgba(91, 66, 106, 0.08);
          text-decoration: none;
        }

        :global(.company-document-card .folder-icon) {
          display: grid;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: 12px;
          background: #f4edf8;
          color: #6e5084;
          font-size: 19px;
          font-weight: 800;
        }

        :global(.company-document-card h3) {
          margin: 1px 0 8px;
          color: #6e5084;
          font-size: 17px;
          font-weight: 750;
          text-decoration: none;
        }

        :global(.company-document-card p) {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
          text-decoration: none;
        }

        :global(.company-document-card .open-label),
        :global(.company-document-card .empty-label) {
          display: inline-block;
          margin-top: 16px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        :global(.company-document-card .open-label) {
          color: #6e5084;
        }

        :global(.company-document-card .empty-label) {
          color: #94a3b8;
        }

        @media (max-width: 700px) {
          .hero {
            display: grid;
          }

          .organisation-reference {
            width: max-content;
          }
        }
      `}</style>
    </div>
  );
}