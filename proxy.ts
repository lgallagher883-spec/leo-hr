import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest, _event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Redirect the app homepage immediately, before checking Supabase.
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};