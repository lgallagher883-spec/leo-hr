import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const resourceTypes = [
  {
    type: "factsheets",
    catalogueFile: "factsheetsCatalogue.ts",
  },
  {
    type: "guides",
    catalogueFile: "guidesCatalogue.ts",
  },
  {
    type: "letters",
    catalogueFile: "lettersCatalogue.ts",
  },
  {
    type: "checklists",
    catalogueFile: "checklistsCatalogue.ts",
  },
  {
    type: "forms",
    catalogueFile: "formsCatalogue.ts",
  },
  {
    type: "toolkits",
    catalogueFile: "toolkitsCatalogue.ts",
  },
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getFolderIds(resourceDir) {
  const entries = await fs.readdir(resourceDir, { withFileTypes: true });
  const ids = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith("[")) {
      continue;
    }

    const pagePath = path.join(resourceDir, entry.name, "page.tsx");
    if (await exists(pagePath)) {
      ids.push(entry.name);
    }
  }

  return ids.sort();
}

async function getCatalogueIds(cataloguePath) {
  const raw = await fs.readFile(cataloguePath, "utf8");
  const ids = [];

  for (const match of raw.matchAll(/id:\s*"([^"]+)"/g)) {
    ids.push(match[1]);
  }

  return ids.sort();
}

async function validateType({ type, catalogueFile }) {
  const resourceDir = path.join(projectRoot, "app", "dashboard", "policies", type);
  const cataloguePath = path.join(resourceDir, catalogueFile);

  const folderIds = await getFolderIds(resourceDir);
  const catalogueIds = await getCatalogueIds(cataloguePath);

  const folderSet = new Set(folderIds);
  const catalogueSet = new Set(catalogueIds);

  const missingInCatalogue = folderIds.filter((id) => !catalogueSet.has(id));
  const missingFolders = catalogueIds.filter((id) => !folderSet.has(id));

  return {
    type,
    missingInCatalogue,
    missingFolders,
  };
}

async function run() {
  const results = await Promise.all(resourceTypes.map(validateType));
  const issues = [];

  for (const result of results) {
    for (const id of result.missingInCatalogue) {
      issues.push(
        `[${result.type}] Folder exists but is missing from catalogue: ${id}`
      );
    }

    for (const id of result.missingFolders) {
      issues.push(
        `[${result.type}] Catalogue entry points to missing folder: ${id}`
      );
    }
  }

  if (issues.length > 0) {
    console.error("HR resource catalogue validation failed.\n");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("HR resource catalogue validation passed.");
}

run().catch((error) => {
  console.error("HR resource catalogue validation failed with an unexpected error.");
  console.error(error);
  process.exit(1);
});
