import Link from "next/link";

const checks = [
  ["DBS status", "No DBS recorded"],
  ["Certificate number", "Not recorded"],
  ["Issue date", "Not recorded"],
  ["Expiry / review", "Not applicable"],
  ["Update Service", "Not subscribed"],
  ["Safeguarding training", "No record"],
];

export default function DbsSafeguardingPage() {
  return (
    <main style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{color:"#6E5084",fontWeight:800,fontSize:12,textTransform:"uppercase"}}>
        Employee workspace
      </p>

      <h1 style={{fontSize:32,color:"#6E5084",margin:"8px 0"}}>
        DBS &amp; Safeguarding
      </h1>

      <p style={{color:"#64748B",marginBottom:24}}>
        Review the DBS and safeguarding records currently held for your employment.
      </p>

      <section style={{
        background:"#F7F1FC",
        border:"1px solid #E4D3EE",
        borderRadius:16,
        padding:20,
        marginBottom:20
      }}>
        <strong style={{color:"#6E5084"}}>Safer recruitment record</strong>
        <p style={{margin:"8px 0 0",color:"#526071",lineHeight:1.6}}>
          DBS and safeguarding records are managed by authorised users and form part
          of your employment compliance record.
        </p>
      </section>

      <section style={{
        background:"#FFFFFF",
        border:"1px solid #E8E2EB",
        borderRadius:18,
        padding:22,
        boxShadow:"0 8px 22px rgba(17,24,39,.05)"
      }}>
        <h2 style={{margin:"0 0 14px",fontSize:18,color:"#2F2635"}}>
          Compliance details
        </h2>

        {checks.map(([label,value])=>(
          <div key={label} style={{
            display:"flex",
            justifyContent:"space-between",
            gap:20,
            padding:"14px 0",
            borderBottom:"1px solid #F0EDF2"
          }}>
            <span style={{color:"#64748B",fontWeight:700}}>
              {label}
            </span>

            <span style={{
              color:value.startsWith("No")||value==="Not recorded"||value==="Not subscribed"
                ? "#94A3B8"
                : "#2F2635",
              fontWeight:600
            }}>
              {value}
            </span>
          </div>
        ))}

        <button
          disabled
          style={{
            marginTop:18,
            padding:"10px 16px",
            borderRadius:10,
            border:"1px solid #D8DCE2",
            background:"#F8FAFC",
            color:"#94A3B8",
            cursor:"not-allowed",
            fontWeight:700
          }}
        >
          Upload DBS document
        </button>
      </section>

      <div style={{marginTop:24}}>
        <Link
          href="/dashboard/my-employment"
          style={{
            textDecoration:"none",
            color:"#6E5084",
            border:"1px solid #CDB2E2",
            borderRadius:10,
            padding:"10px 16px",
            display:"inline-block",
            fontWeight:700
          }}
        >
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}