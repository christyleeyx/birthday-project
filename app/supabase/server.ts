import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// This helper creates a Supabase client for server-side code.
// It uses the Next.js cookie helpers so Supabase can read the auth session.
export async function createServerSupabaseClient() {
  const requestCookies = await cookies();
  const allCookies = requestCookies.getAll();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () =>
          allCookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),
        setAll: async () => {},
      },
    },
  );
}
