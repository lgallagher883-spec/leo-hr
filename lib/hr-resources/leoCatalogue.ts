import { promises as fs } from "fs";
import path from "path";

export type LeoResourceType =
  | "factsheets"
  | "guides"
  | "checklists"
  | "letters"
  | "forms"
  | "toolkits"
  | "policies"
  | string;

export type ResourceStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "superseded"
  | "archived";

export type OwnershipScope = "leo_owned" | "organisation_owned";

export type ResourceCapabilities = {
  preview: boolean;
  wordExport: boolean;
  pdfExport: boolean;
  askLeo: boolean;
};

export type LeoResourceMetadata = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  resourceType: LeoResourceType;
  topic: string;
  employmentLifecycleStage: string;
  employmentLawCategory: string;
  searchableKeywords: string[];
  version: string;
  reviewDate: string | null;
  author: string;
  status: ResourceStatus;
  effectiveDate: string | null;
  supersededBy: string | null;
  relatedResources: string[];
  featured: boolean;
  aiAvailability: "available" | "planned" | "disabled";
  organisationVisibility: "all" | "restricted";
  ownershipScope: OwnershipScope;
  route: string;
  breadcrumbs: Array<{ label: string; href: string }>;
  sortOrder: number;
  capabilities: ResourceCapabilities;
  sourceFile: string;
};

type ResourceMetaOverride = Partial<LeoResourceMetadata> & {
  relatedResources?: string[];
  searchableKeywords?: string[];
};

const POLICY_ROOT = path.join(
  process.cwd(),
  "app",
  "dashboard",
  "policies",
);

const EXCLUDED_DIRS = new Set(["[category]", "organisation"]);

const TYPE_LABELS: Record<string, string> = {
  factsheets: "Factsheets",
  guides: "Guides",
  checklists: "Checklists",
  letters: "Letter Templates",
  forms: "Forms",
  toolkits: "Toolkits",
  policies: "Policies",
};

const FEATURED_PRIORITY: Record<string, number> = {
  checklists: 1,
  factsheets: 1,
  guides: 1,
  letters: 1,
  forms: 1,
  toolkits: 1,
};

let catalogueCache:
  | {
      cacheKey: string;
      resources: LeoResourceMetadata[];
    }
  | null = null;

export async function getLeoResourceCatalogue() {
  const resources = await buildCatalogueWithCache();
  return resources;
}

export async function getLeoResourceByRoute(input: {
  resourceType: string;
  slug: string;
}) {
  const resources = await buildCatalogueWithCache();
  return (
    resources.find(
      (resource) =>
        resource.resourceType === input.resourceType &&
        resource.slug === input.slug,
    ) || null
  );
}

export async function getLeoResourcesByType(resourceType: string) {
  const resources = await buildCatalogueWithCache();

  return resources
    .filter((resource) => resource.resourceType === resourceType)
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.title.localeCompare(b.title);
    });
}

export async function getLeoResourceTypeSummaries() {
  const resources = await buildCatalogueWithCache();

  const grouped = new Map<
    string,
    {
      resourceType: string;
      title: string;
      description: string;
      resourceCount: number;
      featuredCount: number;
      topicCount: number;
      href: string;
    }
  >();

  for (const resource of resources) {
    const existing = grouped.get(resource.resourceType);

    if (existing) {
      existing.resourceCount += 1;
      if (resource.featured) {
        existing.featuredCount += 1;
      }
      continue;
    }

    grouped.set(resource.resourceType, {
      resourceType: resource.resourceType,
      title: TYPE_LABELS[resource.resourceType] || toTitle(resource.resourceType),
      description: `Browse LEO ${TYPE_LABELS[resource.resourceType] || resource.resourceType} resources.`,
      resourceCount: 1,
      featuredCount: resource.featured ? 1 : 0,
      topicCount: 0,
      href: `/dashboard/policies/${resource.resourceType}`,
    });
  }

  for (const summary of grouped.values()) {
    const uniqueTopics = new Set(
      resources
        .filter((resource) => resource.resourceType === summary.resourceType)
        .map((resource) => resource.topic)
        .filter(Boolean),
    );

    summary.topicCount = uniqueTopics.size;
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

async function buildCatalogueWithCache() {
  const cacheKey = await buildCacheKey();

  if (catalogueCache && catalogueCache.cacheKey === cacheKey) {
    return catalogueCache.resources;
  }

  const resources = await discoverResources();
  const withRelated = attachRelatedResources(resources);

  catalogueCache = {
    cacheKey,
    resources: withRelated,
  };

  return withRelated;
}

async function buildCacheKey() {
  const dirs = await safeReadDir(POLICY_ROOT);

  const keyParts: string[] = [];

  for (const dirent of dirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    if (EXCLUDED_DIRS.has(dirent.name)) {
      continue;
    }

    const directoryPath = path.join(POLICY_ROOT, dirent.name);
    const stats = await fs.stat(directoryPath);
    keyParts.push(`${dirent.name}:${stats.mtimeMs}`);
  }

  return keyParts.sort().join("|");
}

async function discoverResources() {
  const resourceTypes = await safeReadDir(POLICY_ROOT);
  const resources: LeoResourceMetadata[] = [];

  for (const dirent of resourceTypes) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const resourceType = dirent.name;

    if (EXCLUDED_DIRS.has(resourceType)) {
      continue;
    }

    const resourceTypeDir = path.join(POLICY_ROOT, resourceType);
    const entries = await safeReadDir(resourceTypeDir);

    let sequence = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name.startsWith("[")) {
        continue;
      }

      const slug = entry.name;
      const pageFile = path.join(resourceTypeDir, slug, "page.tsx");

      if (!(await fileExists(pageFile))) {
        continue;
      }

      sequence += 1;

      const content = await fs.readFile(pageFile, "utf8");
      const override = await loadOverride(resourceTypeDir, slug);

      const title =
        readConstant(content, "resourceTitle") ||
        readObjectLiteralValue(content, "title") ||
        override.title ||
        toTitle(slug);

      const summary =
        readConstant(content, "resourceSummary") ||
        readObjectLiteralValue(content, "summary") ||
        override.summary ||
        `${title} resource available in the LEO HR library.`;

      const topic =
        override.topic || inferTopicFromText(`${title} ${summary}`, resourceType);

      const reviewDate =
        override.reviewDate || readDateHint(content) || readDateHint(summary);

      const lawCategory =
        override.employmentLawCategory || inferLawCategory(`${title} ${summary}`);

      const lifecycle =
        override.employmentLifecycleStage ||
        inferLifecycleStage(`${title} ${summary}`);

      const keywords =
        override.searchableKeywords ||
        buildKeywords(`${title} ${summary} ${topic} ${lawCategory} ${lifecycle}`);

      const featuredDefault =
        sequence <= (FEATURED_PRIORITY[resourceType] || 0);

      const metadata: LeoResourceMetadata = {
        id: `${resourceType}:${slug}`,
        slug,
        title,
        summary,
        resourceType,
        topic,
        employmentLifecycleStage: lifecycle,
        employmentLawCategory: lawCategory,
        searchableKeywords: keywords,
        version: override.version || "1.0",
        reviewDate,
        author: override.author || "LEO Professional Team",
        status: override.status || "published",
        effectiveDate: override.effectiveDate || reviewDate,
        supersededBy: override.supersededBy || null,
        relatedResources: override.relatedResources || [],
        featured: override.featured ?? featuredDefault,
        aiAvailability: override.aiAvailability || "available",
        organisationVisibility: override.organisationVisibility || "all",
        ownershipScope: "leo_owned",
        route: `/dashboard/policies/${resourceType}/${slug}`,
        breadcrumbs: buildBreadcrumbs(resourceType, slug, title),
        sortOrder: override.sortOrder ?? sequence,
        capabilities: {
          preview: override.capabilities?.preview ?? true,
          wordExport: override.capabilities?.wordExport ?? true,
          pdfExport: override.capabilities?.pdfExport ?? true,
          askLeo: override.capabilities?.askLeo ?? true,
        },
        sourceFile: relativeWorkspacePath(pageFile),
      };

      resources.push(metadata);
    }
  }

  return resources;
}

async function loadOverride(resourceTypeDir: string, slug: string) {
  const overridePath = path.join(resourceTypeDir, slug, "resource.meta.json");

  if (!(await fileExists(overridePath))) {
    return {} as ResourceMetaOverride;
  }

  try {
    const raw = await fs.readFile(overridePath, "utf8");
    return JSON.parse(raw) as ResourceMetaOverride;
  } catch {
    return {} as ResourceMetaOverride;
  }
}

function attachRelatedResources(resources: LeoResourceMetadata[]) {
  return resources.map((resource) => {
    if (resource.relatedResources.length > 0) {
      return resource;
    }

    const scored = resources
      .filter((candidate) => candidate.id !== resource.id)
      .map((candidate) => {
        let score = 0;

        if (candidate.resourceType === resource.resourceType) {
          score += 4;
        }

        if (candidate.topic === resource.topic) {
          score += 3;
        }

        if (
          candidate.employmentLawCategory === resource.employmentLawCategory
        ) {
          score += 2;
        }

        if (
          candidate.employmentLifecycleStage === resource.employmentLifecycleStage
        ) {
          score += 1;
        }

        const overlap = candidate.searchableKeywords.filter((keyword) =>
          resource.searchableKeywords.includes(keyword),
        ).length;

        score += Math.min(overlap, 3);

        return {
          id: candidate.id,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.id);

    return {
      ...resource,
      relatedResources: scored,
    };
  });
}

function buildBreadcrumbs(resourceType: string, slug: string, title: string) {
  return [
    {
      label: "HR Resources",
      href: "/dashboard/policies",
    },
    {
      label: TYPE_LABELS[resourceType] || toTitle(resourceType),
      href: `/dashboard/policies/${resourceType}`,
    },
    {
      label: title,
      href: `/dashboard/policies/${resourceType}/${slug}`,
    },
  ];
}

function readConstant(content: string, constantName: string) {
  const doubleQuoted = new RegExp(
    `const\\s+${constantName}\\s*=\\s*\"([^\"]+)\"`,
    "m",
  );

  const singleQuoted = new RegExp(
    `const\\s+${constantName}\\s*=\\s*'([^']+)'`,
    "m",
  );

  const doubleMatch = content.match(doubleQuoted);

  if (doubleMatch?.[1]) {
    return doubleMatch[1];
  }

  const singleMatch = content.match(singleQuoted);

  if (singleMatch?.[1]) {
    return singleMatch[1];
  }

  return "";
}

function readObjectLiteralValue(content: string, key: string) {
  const pattern = new RegExp(`${key}:\\s*\"([^\"]+)\"`, "m");
  const match = content.match(pattern);
  return match?.[1] || "";
}

function readDateHint(content: string) {
  const dateMatch = content.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}/,
  );

  if (!dateMatch) {
    return null;
  }

  return dateMatch[0];
}

function inferTopicFromText(text: string, resourceType: string) {
  const value = text.toLowerCase();

  if (value.includes("disciplin")) return "Disciplinary";
  if (value.includes("grievance")) return "Grievance";
  if (value.includes("probation")) return "Probation";
  if (value.includes("absence") || value.includes("sickness")) return "Sickness & absence";
  if (value.includes("flexible")) return "Flexible working";
  if (value.includes("leave") || value.includes("holiday")) return "Pay & working time";
  if (value.includes("right to work") || value.includes("recruit")) return "Recruitment";
  if (value.includes("contract")) return "Contracts & changes";

  return TYPE_LABELS[resourceType] || toTitle(resourceType);
}

function inferLawCategory(text: string) {
  const value = text.toLowerCase();

  if (value.includes("right to work") || value.includes("immigration")) return "Immigration and right to work";
  if (value.includes("disciplin") || value.includes("grievance")) return "Employee relations";
  if (value.includes("absence") || value.includes("disability")) return "Absence and wellbeing";
  if (value.includes("contract") || value.includes("employment rights")) return "Employment rights";
  if (value.includes("flexible")) return "Flexible working";

  return "General employment law";
}

function inferLifecycleStage(text: string) {
  const value = text.toLowerCase();

  if (value.includes("recruit") || value.includes("offer") || value.includes("right to work")) return "Recruitment";
  if (value.includes("new starter") || value.includes("probation") || value.includes("onboarding")) return "Onboarding";
  if (value.includes("performance") || value.includes("disciplin") || value.includes("grievance")) return "Employment management";
  if (value.includes("absence") || value.includes("leave") || value.includes("wellbeing")) return "Employment support";
  if (value.includes("exit") || value.includes("termination") || value.includes("redundancy")) return "Employment exit";

  return "Employment management";
}

function buildKeywords(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 4),
    ),
  ).slice(0, 30);
}

function toTitle(value: string) {
  return value
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function relativeWorkspacePath(filePath: string) {
  return filePath
    .replace(process.cwd(), "")
    .replaceAll("\\", "/")
    .replace(/^\//, "");
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function safeReadDir(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
