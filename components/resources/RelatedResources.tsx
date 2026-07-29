"use client";

import Link from "next/link";

export type RelatedResource = {
  title: string;
  href: string;
  type?: string;
};

type RelatedResourcesProps = {
  resources: RelatedResource[];
  title?: string;
  emptyMessage?: string;
};

export default function RelatedResources({
  resources,
  title = "Related resources",
  emptyMessage = "No related resources have been added yet.",
}: RelatedResourcesProps) {
  return (
    <section className="related-card">
      <style jsx>{`
        .related-card {
          padding: 20px;
          border: 1px solid #eadff0;
          border-radius: 16px;
          background: #ffffff;
        }

        .related-card h2 {
          margin: 0;
          color: #6e5084;
          font-size: 18px;
          font-weight: 600;
        }

        .related-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .empty-message {
          margin: 10px 0 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }

        :global(.related-link) {
          display: block;
          padding: 12px;
          border: 1px solid #eee7f1;
          border-radius: 11px;
          color: #6e5084;
          text-decoration: none;
          transition:
            transform 150ms ease,
            background 150ms ease,
            border-color 150ms ease;
        }

        :global(.related-link:hover) {
          transform: translateY(-1px);
          border-color: #d8c8e1;
          background: #faf6fc;
        }

        :global(.related-link:focus-visible) {
          outline: 3px solid rgba(185, 149, 206, 0.3);
          outline-offset: 2px;
        }

        .resource-title {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }

        .resource-type {
          display: block;
          margin-top: 4px;
          color: #8b7896;
          font-size: 12px;
          font-weight: 500;
        }

        @media print {
          .related-card {
            display: none;
          }
        }
      `}</style>

      <h2>{title}</h2>

      {resources.length > 0 ? (
        <div className="related-list">
          {resources.map((resource) => (
            <Link
              className="related-link"
              href={resource.href}
              key={`${resource.href}-${resource.title}`}
            >
              <span className="resource-title">{resource.title}</span>

              {resource.type ? (
                <span className="resource-type">{resource.type}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-message">{emptyMessage}</p>
      )}
    </section>
  );
}