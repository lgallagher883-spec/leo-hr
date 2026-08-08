import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-leo-pathname", request.nextUrl.pathname);

  const createNextResponse = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  let response = createNextResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = createNextResponse();

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /*
   * Do not remove this call.
   * It validates or refreshes the user's authentication session.
   */
  await supabase.auth.getUser();

  return response;
}