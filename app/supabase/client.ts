import { createClient } from "@supabase/supabase-js";

// Read the public Supabase connection values from environment variables.
// These values are safe for browser use because they are the anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Guard against missing environment variables.
// This gives a clear error immediately rather than failing later in the app.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create the Supabase client that frontend pages will use.
// This client is used for auth, storage, and database calls from the browser.
export const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
