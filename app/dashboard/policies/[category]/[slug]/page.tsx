import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getLeoResourceByRoute,
  getLeoResourceCatalogue,
} from "@/lib/hr-resources/leoCatalogue";

type ResourcePreviewPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

function getRelatedResources(
  catalogue: Awaited<ReturnType<typeof getLeoResourceCatalogue>>,
  relatedIds: string[],
) {
  return relatedIds
    .map((id) => catalogue.find((resource) => resource.id === id) || null)
    .filter((resource): resource is NonNullable<typeof resource> => Boolean(resource));
}

export const dynamic = "force-dynamic";

export default async function ResourcePreviewPage(props: ResourcePreviewPageProps) {
  const params = await props.params;

  const resource = await getLeoResourceByRoute({
    resourceType: params.category,
    slug: params.slug,
  });

  if (!resource) {
    notFound();
  }

  const catalogue = await getLeoResourceCatalogue();
  const relatedResources = getRelatedResources(catalogue, resource.relatedResources);

  const askLeoPrompt = [
    `I am reviewing the LEO ${resource.resourceType.slice(0, -1)} "${resource.title}".`,
    resource.summary,
    "Please use this resource as context for my question.",
  ].join("\n\n");

  const askLeoHref =
    `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
    `&resourceTitle=${encodeURIComponent(resource.title)}` +
    `&resourceType=${encodeURIComponent(resource.resourceType.replace(/s$/, ""))}` +
    `&returnUrl=${encodeURIComponent(resource.route)}`;

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <nav style={styles.breadcrumb} aria-label="Resource breadcrumb">
          {resource.breadcrumbs.map((crumb, index) => (
            <span key={crumb.href}>
              {index < resource.breadcrumbs.length - 1 ? (
                <>
                  <Link href={crumb.href} style={styles.breadcrumbLink}>
                    {crumb.label}
                  </Link>
                  <span> / </span>
                </>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <section style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Resource Preview</p>
            <h1 style={styles.title}>{resource.title}</h1>
            <p style={styles.summary}>{resource.summary}</p>

            <div style={styles.metadataWrap}>
              <span style={styles.pill}>{resource.topic}</span>
              <span style={styles.pill}>{resource.employmentLifecycleStage}</span>
              <span style={styles.pill}>{resource.employmentLawCategory}</span>
              <span style={styles.pill}>Version {resource.version}</span>
              <span style={styles.pill}>Status: {resource.status.replaceAll("_", " ")}</span>
            </div>
          </div>

          <div style={styles.actions}>
            <Link href={resource.route} style={styles.primaryAction}>
              Open Full Resource
            </Link>
            <Link href={resource.route} style={styles.secondaryAction}>
              Word
            </Link>
            <Link href={resource.route} style={styles.secondaryAction}>
              PDF
            </Link>
            <Link href={askLeoHref} style={styles.secondaryAction}>
              Ask Leo
            </Link>
          </div>
        </section>

        <section style={styles.layout}>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>Metadata-driven Preview</h2>
            <p style={styles.cardText}>
              This page is rendered from shared resource metadata. The original
              resource route and export behavior remain intact, while preview
              navigation, related resources and context actions are centrally defined.
            </p>

            <div style={styles.metaList}>
              <span>Resource type: {resource.resourceType}</span>
              <span>Owner: {resource.ownershipScope}</span>
              <span>Author: {resource.author}</span>
              <span>Review date: {resource.reviewDate || "Not set"}</span>
              <span>Effective date: {resource.effectiveDate || "Not set"}</span>
              <span>Superseded by: {resource.supersededBy || "No replacement recorded"}</span>
              <span>Organisation visibility: {resource.organisationVisibility}</span>
              <span>AI availability: {resource.aiAvailability}</span>
            </div>
          </article>

          <aside style={styles.sidebar}>
            <section style={styles.sideCard}>
              <h2 style={styles.sideTitle}>Related Resources</h2>
              {relatedResources.length === 0 ? (
                <p style={styles.cardText}>No related resources are currently mapped.</p>
              ) : (
                <div style={styles.relatedList}>
                  {relatedResources.map((related) => (
                    <Link key={related.id} href={related.route} style={styles.relatedLink}>
                      {related.title}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section style={styles.sideCard}>
              <h2 style={styles.sideTitle}>Keywords</h2>
              <div style={styles.keywordWrap}>
                {resource.searchableKeywords.slice(0, 16).map((keyword) => (
                  <span key={keyword} style={styles.keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    padding: "32px",
    background: "linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%)",
    color: "#334155",
  },
  shell: {
    maxWidth: "1180px",
    margin: "0 auto",
  },
  breadcrumb: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    color: "#7f668c",
    fontSize: "14px",
  },
  breadcrumbLink: {
    color: "#6e5084",
    textDecoration: "none",
    fontWeight: 600,
  },
  header: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "20px",
    padding: "30px",
    borderRadius: "22px",
    border: "1px solid #eadff0",
    background: "#ffffff",
    boxShadow: "0 15px 42px rgba(56, 42, 69, 0.07)",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#8a6a9e",
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    color: "#5f4472",
    fontSize: "clamp(30px, 4.8vw, 50px)",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    fontWeight: 500,
  },
  summary: {
    margin: "14px 0 0",
    color: "#64748b",
    lineHeight: 1.72,
    fontSize: "16px",
    maxWidth: "760px",
  },
  metadataWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "0 11px",
    borderRadius: "999px",
    background: "#f7f1fc",
    color: "#6e5084",
    fontSize: "12px",
    fontWeight: 600,
  },
  actions: {
    display: "grid",
    gap: "10px",
    minWidth: "210px",
  },
  primaryAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 650,
    border: "1px solid #6e5084",
    background: "#6e5084",
    color: "#ffffff",
  },
  secondaryAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 650,
    border: "1px solid #d9cde2",
    background: "#ffffff",
    color: "#6e5084",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 290px",
    gap: "22px",
    marginTop: "24px",
    alignItems: "start",
  },
  card: {
    padding: "32px",
    border: "1px solid #eadff0",
    borderRadius: "18px",
    background: "#ffffff",
  },
  cardTitle: {
    margin: "0 0 12px",
    color: "#5f4472",
    fontSize: "22px",
    fontWeight: 550,
  },
  cardText: {
    margin: 0,
    color: "#4c5f74",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  metaList: {
    display: "grid",
    gap: "10px",
    marginTop: "18px",
    fontSize: "13px",
    color: "#5b6c7e",
  },
  sidebar: {
    display: "grid",
    gap: "16px",
  },
  sideCard: {
    padding: "18px",
    border: "1px solid #eadff0",
    borderRadius: "15px",
    background: "#ffffff",
  },
  sideTitle: {
    margin: "0 0 10px",
    color: "#6e5084",
    fontSize: "17px",
    fontWeight: 600,
  },
  relatedList: {
    display: "grid",
    gap: "8px",
  },
  relatedLink: {
    color: "#6e5084",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
  },
  keywordWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  keyword: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "25px",
    padding: "0 8px",
    borderRadius: "999px",
    background: "#f8f3fb",
    color: "#6d527f",
    fontSize: "11px",
  },
} as const;
