import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

export default async function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: isPlatformAdministrator, error: accessError } =
    await supabase.rpc("leo_is_platform_administrator");

  if (accessError) {
    console.error(
      "LEO could not verify Platform Admin access:",
      accessError,
    );

    redirect("/dashboard");
  }

  if (isPlatformAdministrator !== true) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}