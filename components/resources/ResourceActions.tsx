"use client";

import Link from "next/link";

type ResourceActionsProps = {
  onWord: () => void;
  onPdf: () => void;
  onPrint: () => void;
  onAddToOrganisationResources: () => void;
  addedToOrganisationResources?: boolean;
  askLeoHref?: string;
  disabled?: boolean;
};

export default function ResourceActions({
  onWord,
  onPdf,
  onPrint,
  onAddToOrganisationResources,
  addedToOrganisationResources = false,
  askLeoHref = "/dashboard/ask-leo",
  disabled = false,
}: ResourceActionsProps) {
  return (
    <div className="resource-actions" aria-label="Resource actions">
      <style jsx>{`
        .resource-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #eadff0;
          border-radius: 16px;
          background: #ffffff;
        }

        .action-button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border: 1px solid #dfd4e5;
          border-radius: 12px;
          background: #ffffff;
          color: #6e5084;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 150ms ease,
            background 150ms ease,
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #cdb2e2;
          background: #faf6fc;
        }

        .action-button:focus-visible {
          outline: 3px solid rgba(185, 149, 206, 0.3);
          outline-offset: 2px;
        }

        .action-button.primary {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(110, 80, 132, 0.16);
        }

        .action-button.primary:hover:not(:disabled) {
          background: #5f4573;
          box-shadow: 0 10px 24px rgba(110, 80, 132, 0.2);
        }

        .action-button.success {
          border-color: #b9d8c6;
          background: #f5fff9;
          color: #536f62;
        }

        .action-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        :global(.ask-leo-link) {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border: 1px solid #dfd4e5;
          border-radius: 12px;
          background: #ffffff;
          color: #6e5084;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition:
            transform 150ms ease,
            background 150ms ease,
            border-color 150ms ease;
        }

        :global(.ask-leo-link:hover) {
          transform: translateY(-1px);
          border-color: #cdb2e2;
          background: #faf6fc;
        }

        :global(.ask-leo-link:focus-visible) {
          outline: 3px solid rgba(185, 149, 206, 0.3);
          outline-offset: 2px;
        }

        @media print {
          .resource-actions {
            display: none;
          }
        }

        @media (max-width: 540px) {
          .action-button,
          :global(.ask-leo-link) {
            width: 100%;
          }
        }
      `}</style>

      <button
        className="action-button primary"
        type="button"
        onClick={onWord}
        disabled={disabled}
      >
        Word
      </button>

      <button
        className="action-button"
        type="button"
        onClick={onPdf}
        disabled={disabled}
      >
        PDF
      </button>

      <button
        className="action-button"
        type="button"
        onClick={onPrint}
        disabled={disabled}
      >
        Print
      </button>

      <Link className="ask-leo-link" href={askLeoHref}>
        <span aria-hidden="true">✦</span>
        Ask Leo
      </Link>

      <button
        className={`action-button ${
          addedToOrganisationResources ? "success" : ""
        }`}
        type="button"
        onClick={onAddToOrganisationResources}
        disabled={disabled || addedToOrganisationResources}
      >
        {addedToOrganisationResources
          ? "Added to organisation resources"
          : "Add to organisation resources"}
      </button>
    </div>
  );
}