import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client used by interactive hooks and components.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () =>
  createBrowserClient(supabaseUrl!, supabaseKey!);
