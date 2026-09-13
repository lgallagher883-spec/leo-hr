"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { jobDescriptionsCatalogue } from "./jobDescriptionsCatalogue";

type JobDescription = {
  id: string; title: string; summary: string; topic: string; lastUpdated?: string; tags: string[];
};

const topics = ["All", "Administration", "Sales"];

export default function JobDescriptionsPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  const visibleResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobDescriptionsCatalogue.filter((resource) =>
      (activeTopic === "All" || resource.topic === activeTopic) &&
      (!query || `${resource.title} ${resource.summary} ${resource.tags.join(" ")}`.toLowerCase().includes(query))
    );
  }, [activeTopic, search]);

  return (
    <main className="page">
      <style jsx>{`
        .page{min-height:100%;padding:32px;background:linear-gradient(180deg,#fbf8fd 0%,#fff 42%);color:#334155}
        .shell{max-width:1220px;margin:0 auto}.back{display:inline-flex;margin-bottom:24px;color:#6e5084;font-size:14px;font-weight:600;text-decoration:none}
        .hero{padding:34px;border:1px solid #eadff0;border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 16px 45px rgba(91,66,106,.07)}
        .eyebrow{margin:0 0 8px;color:#8a6a9e;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
        h1{margin:0;color:#2f2635;font-size:36px}.intro{max-width:760px;margin:12px 0 0;color:#64748b;line-height:1.65}
        .controls{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}.search{flex:1;min-width:260px;padding:13px 16px;border:1px solid #ded3e4;border-radius:12px;background:#fff;font:inherit}
        .topic{padding:10px 14px;border:1px solid #e4d9e9;border-radius:999px;background:#fff;color:#6e5084;font-weight:600;cursor:pointer}.active{background:#f7f1fc;border-color:#cdb2e2}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{display:flex;flex-direction:column;padding:24px;border:1px solid #eadff0;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(91,66,106,.05)}
        .meta{color:#8a6a9e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.card h2{margin:10px 0 8px;color:#33283a;font-size:20px}.card p{margin:0 0 18px;color:#64748b;line-height:1.6}.open{margin-top:auto;color:#6e5084;font-weight:700;text-decoration:none}.open:hover{text-decoration:underline}
        @media(max-width:760px){.page{padding:20px}.grid{grid-template-columns:1fr}h1{font-size:30px}}
      `}</style>
      <div className="shell">
        <Link className="back" href="/dashboard/policies">← HR Resources</Link>
        <section className="hero">
          <p className="eyebrow">LEO HR Resources</p>
          <h1>Job Descriptions</h1>
          <p className="intro">Ready-to-use job description examples that employers can adapt to suit the role, organisation and level of responsibility.</p>
        </section>
        <div className="controls">
          <input className="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search job descriptions..." />
          {topics.map((topic)=><button key={topic} className={`topic ${activeTopic===topic?"active":""}`} onClick={()=>setActiveTopic(topic)}>{topic}</button>)}
        </div>
        <div className="grid">
          {visibleResources.map((resource)=><article className="card" key={resource.id}>
            <div className="meta">{resource.topic} · {resource.lastUpdated}</div>
            <h2>{resource.title}</h2><p>{resource.summary}</p>
            <Link className="open" href={`/dashboard/policies/job-descriptions/${resource.id}`}>Open resource →</Link>
          </article>)}
        </div>
      </div>
    </main>
  );
}
