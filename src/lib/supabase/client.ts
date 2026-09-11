import { createBrowserClient } from "@supabase/ssr";

// Cliente do navegador — para Client Components (formulários interativos).
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
