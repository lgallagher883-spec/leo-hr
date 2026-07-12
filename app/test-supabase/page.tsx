import { supabase } from "@/lib/supabase";

export default async function TestSupabasePage() {
  const { data, error } = await supabase
    .from("test_connection")
    .select("id, name");

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Test</h1>

      <p>Row count: {data?.length}</p>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}