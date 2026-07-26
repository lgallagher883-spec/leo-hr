import Link from "next/link";

const upcoming = [
  {
    title: "Probation Review",
    due: "No review scheduled",
    status: "Awaiting schedule",
  },
  {
    title: "Performance Review",
    due: "No review scheduled",
    status: "Awaiting schedule",
  },
  {
    title: "Development Review",
    due: "No review scheduled",
    status: "Awaiting schedule",
  },
];

export default function MyReviewsPage() {
  return (
    <main style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{color:"#6E5084",fontWeight:700}}>Employee workspace</p>

      <h1 style={{fontSize:32,color:"#6E5084",margin:"8px 0"}}>
        Upcoming Reviews
      </h1>

      <p style={{color:"#64748B",marginBottom:24}}>
        View upcoming meetings, appraisal dates and completed review history.
      </p>

      <div style={{display:"grid",gap:16}}>
        {upcoming.map((item)=>(
          <div key={item.title}
            style={{
              background:"#fff",
              border:"1px solid #E8E2EB",
              borderRadius:16,
              padding:20,
              boxShadow:"0 8px 22px rgba(17,24,39,.05)"
            }}>
            <div style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center"
            }}>
              <div>
                <h2 style={{margin:0,fontSize:18}}>{item.title}</h2>
                <p style={{margin:"8px 0 0",color:"#64748B"}}>
                  {item.due}
                </p>
              </div>

              <span style={{
                background:"#F7F1FC",
                color:"#6E5084",
                border:"1px solid #DFCDE9",
                padding:"6px 10px",
                borderRadius:999,
                fontWeight:700,
                fontSize:12
              }}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop:24,
        padding:20,
        borderRadius:16,
        border:"1px solid #E4D3EE",
        background:"#F7F1FC"
      }}>
        <strong style={{color:"#6E5084"}}>
          Future capability
        </strong>

        <p style={{margin:"8px 0 0",color:"#526071",lineHeight:1.6}}>
          This page will display objectives, manager feedback, completed
          appraisals, one-to-ones and acknowledgement actions directly from
          the Reviews workspace.
        </p>
      </div>

      <div style={{marginTop:24}}>
        <Link
          href="/dashboard/my-employment"
          style={{
            display:"inline-block",
            textDecoration:"none",
            color:"#6E5084",
            border:"1px solid #CDB2E2",
            borderRadius:10,
            padding:"10px 16px",
            fontWeight:700
          }}
        >
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}