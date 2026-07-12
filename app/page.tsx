import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>LEO AI</h1>

      <p>System loaded</p>

      <div style={{ marginTop: 20 }}>
        <Link href="/dashboard">Go to Dashboard</Link>
        <br />
        <Link href="/ask">Ask Leo</Link>
      </div>
    </main>
  );
}