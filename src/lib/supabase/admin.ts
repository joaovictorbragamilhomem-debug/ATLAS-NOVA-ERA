import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente "admin": usa a chave secreta e ignora RLS por definição.
// Só para o servidor, e só para operações que de fato precisam furar a
// regra de segurança (criar organização no cadastro, webhooks, cron).
// Fica `null` até você configurar o Supabase (.env.local) — ver README.
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
