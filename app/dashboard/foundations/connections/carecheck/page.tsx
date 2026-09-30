import { Suspense } from "react";

import CareCheckConnectionForm from "./CareCheckConnectionForm";

export default async function CareCheckConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ connectionId?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawConnectionId = Array.isArray(params.connectionId)
    ? params.connectionId[0]
    : params.connectionId;
  const connectionId = Number(rawConnectionId);

  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#7D7D7D" }}>Loading CareCheck…</div>}>
      <CareCheckConnectionForm connectionId={connectionId} />
    </Suspense>
  );
}
