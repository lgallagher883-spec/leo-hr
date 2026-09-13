"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { jobDescriptionsCatalogue } from "./jobDescriptionsCatalogue";

type JobDescriptionResource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  lastUpdated?: string;
  tags: string[];
};

const topics = ["All", "Administration", "Sales"];
const publishedResources: JobDescriptionResource[] = jobDescriptionsCatalogue;

export default function JobDescriptionsPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  const visibleResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return publishedResources.filter((resource) => {
      const matchesTopic = activeTopic === "All" || resource.topic === activeTopic;
      const matchesSearch =
        !query ||
        `${resource.title} ${resource.summary} ${resource.topic} ${resource.tags.join(" ")}`
          .toLowerCase()
          .includes(query);
      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  const askLeoHref =
    `/dashboard/ask-leo?prompt=${encodeURIComponent(
      "I am reviewing the LEO Job Descriptions library. Help me choose or adapt a job description for the role I need."
    )}&resourceType=${encodeURIComponent("Job Description")}&returnUrl=${encodeURIComponent(
      "/dashboard/policies/job-descriptions"
    )}`;

  return (
    <main className="library-page">
      <style jsx>{`
        .library-page{min-height:100%;padding:32px;background:linear-gradient(180deg,#fbf8fd 0%,#fff 42%);color:#334155}
        .page-shell{max-width:1220px;margin:0 auto}
        .hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:end;padding:34px;border:1px solid #eadff0;border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 16px 45px rgba(91,66,106,.07)}
        .eyebrow{margin:0 0 8px;color:#8a6a9e;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
        h1{margin:0;color:#6e5084;font-size:clamp(34px,5vw,52px);font-weight:500;letter-spacing:-.035em}
        .hero-copy{max-width:760px;margin:14px 0 0;color:#64748b;font-size:17px;line-height:1.7}
        .hero-badge{min-width:150px;padding:18px 20px;border-radius:18px;background:#f7f1fc;text-align:center}
        .hero-count{display:block;color:#6e5084;font-size:32px;font-weight:600}.hero-count-label{color:#80678f;font-size:13px}
        .toolbar{display:grid;grid-template-columns:minmax(280px,1fr) auto;gap:16px;margin-top:26px}
        .search-wrap{position:relative}.search-icon{position:absolute;left:17px;top:50%;transform:translateY(-50%);color:#90759f}
        .search-input{width:100%;height:52px;box-sizing:border-box;padding:0 18px 0 46px;border:1px solid #dfd4e5;border-radius:14px;background:#fff;color:#334155;font:inherit;outline:none}
        .search-input:focus{border-color:#b995ce;box-shadow:0 0 0 4px rgba(185,149,206,.15)}
        :global(.ask-link){display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 22px;border:1px solid #6e5084;border-radius:14px;background:#6e5084;color:#fff;font-size:14px;font-weight:600;text-decoration:none;box-shadow:0 8px 20px rgba(110,80,132,.16)}
        .content-grid{display:grid;grid-template-columns:250px minmax(0,1fr);gap:26px;margin-top:26px}
        .filters,.library-panel{border:1px solid #eadff0;border-radius:20px;background:#fff}.filters{align-self:start;padding:20px;position:sticky;top:24px}
        .filters-title,.library-title{margin:0;color:#6e5084;font-weight:500}.filters-title{font-size:18px}.library-title{font-size:24px}
        .topic-list{display:grid;gap:5px;margin-top:15px}.topic-button{width:100%;padding:10px 12px;border:0;border-radius:10px;background:transparent;color:#526174;font:inherit;font-size:14px;text-align:left;cursor:pointer}
        .topic-button:hover{background:#faf6fc;color:#6e5084}.topic-button.active{background:#f2e9f8;color:#6e5084;font-weight:600}
        .library-panel{min-height:470px;padding:26px}.library-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:20px;border-bottom:1px solid #eee7f1}.result-count{color:#8b7896;font-size:13px}
        .resource-grid{display:grid;gap:14px;margin-top:20px}.resource-card{padding:22px;border:1px solid #e8dfeb;border-radius:16px;background:#fff;transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease}
        .resource-card:hover{transform:translateY(-2px);border-color:#d8c8e1;box-shadow:0 12px 30px rgba(91,66,106,.08)}
        .resource-heading{display:flex;align-items:flex-start;gap:12px}.resource-icon{display:grid;flex:0 0 auto;width:38px;height:38px;place-items:center;border-radius:11px;background:#f4edf8;color:#6e5084;font-size:17px;font-weight:700}
        .resource-card h3{margin:1px 0 0;color:#6e5084;font-size:18px;font-weight:600}.resource-card p{margin:10px 0 0 50px;color:#64748b;line-height:1.65}
        .resource-meta{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0 50px}.pill{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#f7f1fc;color:#6e5084;font-size:12px;font-weight:600}
        .divider{height:1px;margin:18px 0;background:#eee7f1}.actions{display:flex;flex-wrap:wrap;gap:10px}
        :global(.resource-action){display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:0 16px;border:1px solid #dfd4e5;border-radius:12px;background:#fff;color:#6e5084;font-size:13px;font-weight:600;text-decoration:none}
        :global(.resource-action.primary){border-color:#6e5084;background:#6e5084;color:#fff}
        @media(max-width:850px){.library-page{padding:20px}.hero,.content-grid{grid-template-columns:1fr}.filters{position:static}}
        @media(max-width:540px){.library-page{padding:14px}.hero,.library-panel{padding:22px}}
      `}</style>

      <div className="page-shell">
        <Link className="back-link" href="/dashboard/policies">← Back to HR Resources</Link>

        <section className="hero">
          <div>
            <p className="eyebrow">HR Resources</p>
            <h1>Job Descriptions</h1>
            <p className="hero-copy">
              Ready-to-use role profiles with clear responsibilities, requirements and layouts that employers can adapt to suit their organisation.
            </p>
          </div>
          <div className="hero-badge">
            <span className="hero-count">{publishedResources.length}</span>
            <span className="hero-count-label">published resources</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input className="search-input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search job descriptions by title, topic or keyword..." />
          </div>
          <Link className="ask-link" href={askLeoHref}><span aria-hidden="true">✦</span>Ask Leo</Link>
        </div>

        <div className="content-grid">
          <aside className="filters">
            <h2 className="filters-title">Browse by topic</h2>
            <div className="topic-list">
              {topics.map((topic)=>(
                <button key={topic} type="button" className={`topic-button ${activeTopic===topic?"active":""}`} onClick={()=>setActiveTopic(topic)}>{topic}</button>
              ))}
            </div>
          </aside>

          <section className="library-panel">
            <div className="library-header">
              <h2 className="library-title">{activeTopic === "All" ? "All job descriptions" : activeTopic}</h2>
              <span className="result-count">{visibleResources.length} resources</span>
            </div>

            <div className="resource-grid">
              {visibleResources.map((resource)=>(
                <article className="resource-card" key={resource.id}>
                  <div className="resource-heading"><span className="resource-icon">J</span><h3>{resource.title}</h3></div>
                  <p>{resource.summary}</p>
                  <div className="resource-meta"><span className="pill">{resource.topic}</span><span className="pill">Reviewed {resource.lastUpdated}</span></div>
                  <div className="divider" />
                  <div className="actions">
                    <Link className="resource-action primary" href={`/dashboard/policies/job-descriptions/${resource.id}`}>Open resource</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
