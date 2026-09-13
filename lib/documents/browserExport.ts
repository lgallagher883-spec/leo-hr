"use client";

import type { DocumentBrandSettings } from "@/lib/documents/brandSettings";

let cachedBranding: DocumentBrandSettings | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

async function loadBranding() {
  if (cachedBranding) return cachedBranding;

  try {
    const response = await fetch("/api/document-branding", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const result = await response.json();
    if (!result?.success || !result?.branding) return null;

    cachedBranding = result.branding as DocumentBrandSettings;
    return cachedBranding;
  } catch {
    return null;
  }
}

function buildHeader(brand: DocumentBrandSettings, primary: string) {
  if (brand.headerStyle === "none") return "";

  const logo =
    brand.documentLayout === "branded" && brand.logoUrl
      ? `<img class="org-logo" src="${escapeHtml(brand.logoUrl)}" alt="" width="140" style="width:140px;max-width:140px;height:auto;max-height:64px;object-fit:contain;" />`
      : "";

  if (brand.headerStyle === "minimal") {
    return `<header class="doc-header minimal">${logo}<div class="org-name">${escapeHtml(brand.organisationName)}</div></header>`;
  }

  const registered =
    brand.registeredName && brand.registeredName !== brand.organisationName
      ? `<div class="org-registered">${escapeHtml(brand.registeredName)}</div>`
      : "";

  return `
    <table class="doc-header-table" role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td class="logo-cell" valign="middle">${logo}</td>
        <td class="brand-copy" valign="middle" align="right">
          <div class="org-name">${escapeHtml(brand.organisationName)}</div>
          ${registered}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:12px;">
          <div class="brand-rule" style="background:${primary};height:4px;line-height:4px;font-size:1px;">&nbsp;</div>
        </td>
      </tr>
    </table>
  `;
}

function buildFooter(brand: DocumentBrandSettings) {
  if (brand.footerStyle === "none") return "";

  const details = [
    brand.address,
    brand.telephone,
    brand.email,
    brand.companyNumber ? `Company ${brand.companyNumber}` : "",
    brand.vatNumber ? `VAT ${brand.vatNumber}` : "",
  ].filter(Boolean);

  if (brand.footerStyle === "compact") {
    return `<footer class="doc-footer compact">${details.map(escapeHtml).join(" · ")}</footer>`;
  }

  return `
    <footer class="doc-footer">
      ${brand.confidentialityStatement ? `<div class="confidentiality">${escapeHtml(brand.confidentialityStatement)}</div>` : ""}
      ${details.length ? `<div class="footer-details">${details.map(escapeHtml).join(" · ")}</div>` : ""}
    </footer>
  `;
}

function normaliseBodyHtml(value: string) {
  const bodyMatch = value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : value;
  body = body.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
  return body;
}

export async function buildOrganisationDocumentHtml(
  title: string,
  bodyHtml: string,
  extraCss = "",
) {
  const brand = await loadBranding();
  const plain = brand?.documentLayout === "plain";
  const primary = plain ? "#111827" : brand?.primaryColour || "#6E5084";
  const secondary = plain ? "#FFFFFF" : brand?.secondaryColour || "#F7F1FC";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:18mm}
:root{--brand-primary:${primary};--brand-secondary:${secondary}}
*{box-sizing:border-box}
body{max-width:820px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#334155;line-height:1.65;background:#fff}
.doc-header{margin-bottom:22px}.doc-header.minimal{padding-bottom:12px;border-bottom:1px solid #e5e7eb}
.doc-header-table{width:100%;border-collapse:collapse;margin:0 0 22px}.doc-header-table td{border:0;padding:0}.logo-cell{width:180px}
.org-logo{display:block;width:140px;max-width:140px;height:auto;max-height:64px;object-fit:contain}
.brand-copy{text-align:right}.org-name{color:var(--brand-primary);font-size:18px;font-weight:700}.org-registered{margin-top:3px;color:#64748b;font-size:10pt}
.brand-rule{height:4px;margin-top:0;border-radius:2px}.document-title{margin:0 0 24px;color:var(--brand-primary);font-size:27px;line-height:1.2}
h1,h2,h3,h4{color:var(--brand-primary)!important}h2{margin-top:28px;font-size:20px}h3{margin-top:22px;font-size:16px}
p,li,td,th{font-size:11pt}a{color:var(--brand-primary)}
.notice,.tip{border-color:var(--brand-primary)!important}
.role-grid,.outcome-grid,.form-grid{display:block!important;margin:12px 0 20px!important}
.role-card,.outcome-card,.field-card{display:block!important;width:auto!important;margin:0 0 8px!important;padding:10px 12px!important;border:1px solid #e1e5ea!important;border-radius:0!important;background:var(--brand-secondary)!important}
.role-card strong,.outcome-card strong,.field-card strong{display:inline-block!important;min-width:130px!important;margin-right:8px!important;color:var(--brand-primary)!important}
table{page-break-inside:avoid}h1,h2,h3{page-break-after:avoid}li{page-break-inside:avoid}
.doc-footer{margin-top:36px;padding-top:14px;border-top:1px solid #d8dee6;color:#64748b;font-size:9pt;line-height:1.5}.doc-footer.compact{text-align:center}.confidentiality{margin-bottom:6px;font-weight:600}
.watermark{position:fixed;inset:38% 0 auto;z-index:-1;text-align:center;color:rgba(100,116,139,.09);font-size:54pt;font-weight:700;transform:rotate(-28deg)}
${plain ? ".org-logo{display:none}.brand-rule{background:#111827!important}.role-card,.outcome-card{background:#fff!important}" : ""}
${extraCss}
</style>
</head>
<body>
${brand?.confidentialWatermark ? '<div class="watermark">CONFIDENTIAL</div>' : ""}
${brand ? buildHeader(brand, primary) : ""}
<h1 class="document-title">${escapeHtml(title)}</h1>
<main class="document-body">${normaliseBodyHtml(bodyHtml)}</main>
${brand ? buildFooter(brand) : ""}
</body>
</html>`;
}

export async function downloadBrandedWordFromHtml(
  title: string,
  bodyHtml: string,
  fileName?: string,
  extraCss?: string,
) {
  const response = await fetch("/api/document-export/word", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    body: JSON.stringify({
      title,
      bodyHtml,
      extraCss: extraCss || "",
    }),
  });

  if (!response.ok) {
    let message = "Word export failed.";
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    fileName?.replace(/\.doc$/i, ".docx") ||
    `${safeFileName(title) || "LEO-Document"}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openBrandedPdfFromHtml(
  title: string,
  bodyHtml: string,
  extraCss?: string,
) {
  const html = await buildOrganisationDocumentHtml(title, bodyHtml, extraCss);
  const pdfWindow = window.open("", "_blank");
  if (!pdfWindow) return;
  pdfWindow.document.open();
  pdfWindow.document.write(html);
  pdfWindow.document.close();
}

export async function downloadBrandedWordFromElement(
  title: string,
  elementId = "resource-content",
  fileName?: string,
  extraCss?: string,
) {
  const element = document.getElementById(elementId);
  if (!element) return;
  await downloadBrandedWordFromHtml(title, element.innerHTML, fileName, extraCss);
}

export async function openBrandedPdfFromElement(
  title: string,
  elementId = "resource-content",
  extraCss?: string,
) {
  const element = document.getElementById(elementId);
  if (!element) return;
  await openBrandedPdfFromHtml(title, element.innerHTML, extraCss);
}
