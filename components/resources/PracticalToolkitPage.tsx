"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type ToolkitSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  fields?: string[];
};

type Props = {
  resourceId: string;
  title: string;
  summary: string;
  topic: string;
  sections: ToolkitSection[];
  related?: { label: string; href: string }[];
  effectiveNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function PracticalToolkitPage({
  resourceId,
  title,
  summary,
  topic,
  sections,
  related = [],
  effectiveNote,
}: Props) {
  const router = useRouter();

  const askLeoHref =
    `/dashboard/ask-leo?prompt=${encodeURIComponent(
      [
        `I am reviewing the LEO toolkit "${title}".`,
        summary,
        sections.map((section) => [section.title, ...(section.paragraphs || []), ...(section.bullets || [])].join("\\n")).join("\\n\\n").slice(0, 6000),
        "Please use the toolkit content above as the context for my question.",
      ].join("\n\n"),
    )}` +
    `&resourceTitle=${encodeURIComponent(title)}` +
    `&resourceType=${encodeURIComponent("Toolkit")}` +
    `&returnUrl=${encodeURIComponent(`/dashboard/policies/toolkits/${resourceId}`)}`;

  function documentHtml() {
    const sectionHtml = sections
      .map((section) => {
        const paragraphs = (section.paragraphs || [])
          .map((item) => `<p>${escapeHtml(item)}</p>`)
          .join("");
        const bullets = section.bullets?.length
          ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : "";
        const fields = section.fields?.length
          ? `<div class="fields">${section.fields
              .map(
                (field) =>
                  `<div class="field"><strong>${escapeHtml(field)}</strong><div class="write-line"></div><div class="write-line"></div></div>`,
              )
              .join("")}</div>`
          : "";
        return `<section><h2>${escapeHtml(section.title)}</h2>${paragraphs}${bullets}${fields}</section>`;
      })
      .join("");

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:18mm}body{max-width:820px;margin:40px auto;font-family:Arial,Helvetica,sans-serif;color:#334155;line-height:1.65}
h1,h2{color:#6e5084}h1{font-size:30px;margin-bottom:8px}h2{font-size:20px;margin-top:28px;margin-bottom:10px}
p,li{font-size:11pt}.cover{padding:22px;border:1px solid #eadff0;background:#fbf8fd}.notice{margin-top:28px;padding:14px;border:1px solid #dcece4;background:#f5fff9}
.fields{display:grid;gap:12px}.field{padding:12px;border:1px solid #e8dfeb}.write-line{height:24px;border-bottom:1px solid #cbd5e1}
</style></head><body>
<div class="cover"><p>LEO HR PRACTICAL TOOLKIT</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(summary)}</p></div>
${sectionHtml}
<div class="notice"><strong>Legal review — 12 September 2026</strong><p>General HR guidance for employers in England and Wales. Adapt documents to the facts, contract and organisation policy, and check current official guidance before taking action.${effectiveNote ? " " + escapeHtml(effectiveNote) : ""}</p></div>
</body></html>`;
  }

  function downloadWord() {
    const blob = new Blob(["\ufeff", documentHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LEO-${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(documentHtml());
    w.document.close();
  }

  return (
    <main className="preview-page">
      <style jsx>{`
        .preview-page{min-height:100%;padding:32px;background:linear-gradient(180deg,#fbf8fd 0%,#fff 42%);color:#334155}
        .page-shell{max-width:1180px;margin:0 auto}.back-link{display:inline-flex;margin-bottom:22px;color:#6e5084;font-size:14px;font-weight:600;text-decoration:none}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:30px;border:1px solid #eadff0;border-radius:22px;background:#fff;box-shadow:0 16px 45px rgba(91,66,106,.07)}
        .eyebrow{margin:0 0 8px;color:#8a6a9e;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
        h1{margin:0;color:#6e5084;font-size:clamp(32px,5vw,46px);font-weight:500;letter-spacing:-.03em}.header-copy{max-width:720px;margin:12px 0 0;color:#64748b;font-size:16px;line-height:1.7}
        .updated-pill{display:inline-flex;flex:0 0 auto;min-height:34px;align-items:center;padding:0 12px;border-radius:999px;background:#f7f1fc;color:#6e5084;font-size:12px;font-weight:600}
        .action-bar{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;padding:16px;border:1px solid #eadff0;border-radius:16px;background:#fff}
        .action-button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 16px;border:1px solid #dfd4e5;border-radius:12px;background:#fff;color:#6e5084;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
        .action-button.primary{border-color:#6e5084;background:#6e5084;color:#fff}.action-button.ask-leo{border-color:#cdb2e2;background:#f7f1fc}
        .content-layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;margin-top:24px}.document{padding:42px;border:1px solid #e8dfeb;border-radius:20px;background:#fff;box-shadow:0 16px 40px rgba(91,66,106,.06)}
        .document h2{margin:30px 0 10px;color:#6e5084;font-size:21px;font-weight:600}.document h2:first-of-type{margin-top:0}.document p,.document li{color:#526174;line-height:1.75}.document ul{padding-left:22px}.document li+li{margin-top:8px}
        .fields{display:grid;gap:12px;margin-top:14px}.field{padding:14px;border:1px solid #e8dfeb;border-radius:12px;background:#fcfbfd}.write-line{height:28px;border-bottom:1px solid #d7dee7}
        .notice{margin-top:28px;padding:18px;border:1px solid #dcece4;border-radius:14px;background:#f5fff9;color:#658073}
        .side-panel{align-self:start;position:sticky;top:24px;display:grid;gap:18px}.side-card{padding:20px;border:1px solid #eadff0;border-radius:16px;background:#fff}.side-card h2{margin:0;color:#6e5084;font-size:18px}.side-card p{margin:8px 0 0;color:#718096;font-size:14px;line-height:1.6}.related-list{display:grid;gap:10px;margin-top:14px}.related-link{display:block;padding:12px;border:1px solid #eee7f1;border-radius:11px;color:#6e5084;font-size:13px;font-weight:600;text-decoration:none}
        @media(max-width:880px){.preview-page{padding:20px}.page-header{display:grid}.content-layout{grid-template-columns:1fr}.side-panel{position:static}}@media(max-width:540px){.preview-page{padding:14px}.page-header,.document{padding:22px}}
      `}</style>

      <div className="page-shell">
        <Link className="back-link" href="/dashboard/policies/toolkits">← Back to Toolkits</Link>
        <header className="page-header">
          <div><p className="eyebrow">Practical toolkit</p><h1>{title}</h1><p className="header-copy">{summary}</p></div>
          <span className="updated-pill">Reviewed 12 September 2026</span>
        </header>

        <div className="action-bar">
          <button className="action-button primary" type="button" onClick={downloadWord}>Word</button>
          <button className="action-button" type="button" onClick={openPdf}>PDF</button>
          <button className="action-button ask-leo" type="button" onClick={() => router.push(askLeoHref)}>✦ Ask Leo</button>
        </div>

        <div className="content-layout">
          <article className="document">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                {section.bullets?.length ? <ul>{section.bullets.map((b) => <li key={b}>{b}</li>)}</ul> : null}
                {section.fields?.length ? <div className="fields">{section.fields.map((f) => <div className="field" key={f}><strong>{f}</strong><div className="write-line" /><div className="write-line" /></div>)}</div> : null}
              </section>
            ))}
            <div className="notice"><strong>Legal review — 12 September 2026</strong><br />General HR guidance for employers in England and Wales. Adapt the pack to the facts, contractual terms and your organisation&apos;s policies. {effectiveNote}</div>
          </article>

          <aside className="side-panel">
            <section className="side-card"><h2>About this resource</h2><p>Topic: {topic}<br />Resource ID: {resourceId}<br />Version: 1.0<br />Last reviewed: 12 September 2026<br />Next review: March 2027 or earlier if the law changes</p></section>
            {related.length ? <section className="side-card"><h2>Related resources</h2><div className="related-list">{related.map((item) => <Link className="related-link" href={item.href} key={item.label}>{item.label}</Link>)}</div></section> : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
