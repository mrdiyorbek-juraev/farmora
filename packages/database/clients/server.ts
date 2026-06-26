import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { keys } from "../keys";
import type { Database } from "../types";

export const createClient = async () => {
  const cookieStore = await cookies();
  const env = keys();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from a Server Component — middleware will refresh the session
          }
        },
      },
    }
  );
};
