export default function TestEnvPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Env Check</h1>

      <p>
        Supabase URL:
        <br />
        {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>

      <p>
        OpenAI Key exists:
        <br />
        {process.env.OPENAI_API_KEY ? "YES" : "NO"}
      </p>
    </div>
  );
}