"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import ResourceActions from "./ResourceActions";
import RelatedResources from "./RelatedResources";
import type { RelatedResource } from "./RelatedResources";

type ResourcePreviewProps = {
  title: string;
  category: string;
  summary: string;
  topic: string;
  resourceId: string;
  lastUpdated: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
  relatedResources?: RelatedResource[];
  onWord: () => void;
  onPdf: () => void;
  onPrint: () => void;
  onAddToOrganisationResources: () => void;
  addedToOrganisationResources?: boolean;
  askLeoHref?: string;
  actionDisabled?: boolean;
};

export default function ResourcePreview({
  title,
  category,
  summary,
  topic,
  resourceId,
  lastUpdated,
  backHref,
  backLabel,
  children,
  relatedResources = [],
  onWord,
  onPdf,
  onPrint,
  onAddToOrganisationResources,
  addedToOrganisationResources = false,
  askLeoHref = "/dashboard/ask-leo",
  actionDisabled = false,
}: ResourcePreviewProps) {
  return (
    <main className="preview-page">
      <style jsx>{`
        .preview-page {
          min-height: 100%;
          padding: 32px;
          background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%);
          color: #334155;
        }

        .page-shell {
          max-width: 1180px;
          margin: 0 auto;
        }

        :global(.back-link) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          color: #6e5084;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        :global(.back-link:hover) {
          text-decoration: underline;
        }

        :global(.back-link:focus-visible) {
          outline: 3px solid rgba(185, 149, 206, 0.3);
          outline-offset: 3px;
          border-radius: 4px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 30px;
          border: 1px solid #eadff0;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 16px 45px rgba(91, 66, 106, 0.07);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          color: #6e5084;
          font-size: clamp(32px, 5vw, 46px);
          font-weight: 500;
          letter-spacing: -0.03em;
        }

        .header-copy {
          max-width: 720px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.7;
        }

        .updated-pill {
          display: inline-flex;
          flex: 0 0 auto;
          min-height: 34px;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          background: #f7f1fc;
          color: #6e5084;
          font-size: 12px;
          font-weight: 600;
        }

        .content-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 24px;
          margin-top: 24px;
        }

        .document {
          padding: 42px;
          border: 1px solid #e8dfeb;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 16px 40px rgba(91, 66, 106, 0.06);
        }

        .document :global(h2) {
          margin: 30px 0 10px;
          color: #6e5084;
          font-size: 21px;
          font-weight: 600;
        }

        .document :global(h2:first-child) {
          margin-top: 0;
        }

        .document :global(h3) {
          margin: 24px 0 8px;
          color: #6e5084;
          font-size: 17px;
          font-weight: 600;
        }

        .document :global(p),
        .document :global(li) {
          color: #526174;
          line-height: 1.75;
        }

        .document :global(p) {
          margin: 10px 0 0;
        }

        .document :global(ul),
        .document :global(ol) {
          padding-left: 22px;
        }

        .document :global(li + li) {
          margin-top: 8px;
        }

        .document :global(.notice) {
          margin-top: 28px;
          padding: 18px;
          border: 1px solid #dcece4;
          border-radius: 14px;
          background: #f5fff9;
        }

        .document :global(.notice strong) {
          display: block;
          color: #536f62;
        }

        .document :global(.notice p) {
          margin: 6px 0 0;
          color: #658073;
          font-size: 14px;
        }

        .side-panel {
          position: sticky;
          top: 24px;
          align-self: start;
          display: grid;
          gap: 18px;
        }

        .side-card {
          padding: 20px;
          border: 1px solid #eadff0;
          border-radius: 16px;
          background: #ffffff;
        }

        .side-card h2 {
          margin: 0;
          color: #6e5084;
          font-size: 18px;
          font-weight: 600;
        }

        .side-card p {
          margin: 8px 0 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.65;
        }

        @media print {
          :global(.back-link),
          .page-header,
          .side-panel {
            display: none !important;
          }

          .preview-page {
            padding: 0;
            background: #ffffff;
          }

          .content-layout {
            display: block;
            margin: 0;
          }

          .document {
            padding: 0;
            border: 0;
            box-shadow: none;
          }
        }

        @media (max-width: 880px) {
          .preview-page {
            padding: 20px;
          }

          .page-header {
            display: grid;
          }

          .content-layout {
            grid-template-columns: 1fr;
          }

          .side-panel {
            position: static;
          }
        }

        @media (max-width: 540px) {
          .preview-page {
            padding: 14px;
          }

          .page-header,
          .document {
            padding: 22px;
          }
        }
      `}</style>

      <div className="page-shell">
        <Link className="back-link" href={backHref}>
          ← {backLabel}
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">{category}</p>
            <h1>{title}</h1>
            <p className="header-copy">{summary}</p>
          </div>

          <span className="updated-pill">Updated {lastUpdated}</span>
        </header>

        <ResourceActions
          onWord={onWord}
          onPdf={onPdf}
          onPrint={onPrint}
          onAddToOrganisationResources={onAddToOrganisationResources}
          addedToOrganisationResources={addedToOrganisationResources}
          askLeoHref={askLeoHref}
          disabled={actionDisabled}
        />

        <div className="content-layout">
          <article className="document" id="resource-content">
            {children}
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: {topic}
                <br />
                Resource ID: {resourceId}
                <br />
                Last reviewed: {lastUpdated}
              </p>
            </section>

            <RelatedResources resources={relatedResources} />
          </aside>
        </div>
      </div>
    </main>
  );
}