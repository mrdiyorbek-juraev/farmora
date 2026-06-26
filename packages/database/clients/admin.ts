import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { keys } from "../keys";
import type { Database } from "../types";

/**
 * Admin client — uses the service role key, bypasses RLS.
 * Use only in trusted server contexts (server actions, route handlers, webhooks)
 * after verifying the Clerk session.
 */
export const createAdminClient = () => {
  const env = keys();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
