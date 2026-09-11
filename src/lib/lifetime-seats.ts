import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Vagas restantes do plano Vitalício, lidas do banco de verdade — nunca um
// número inventado. Enquanto o Supabase ou o total de vagas não estiverem
// configurados, retorna `null` e a tela simplesmente não mostra a contagem.
export async function getLifetimeSeatsRemaining(): Promise<number | null> {
  const total = Number(process.env.LIFETIME_SEATS_TOTAL ?? "");
  if (!Number.isFinite(total) || total <= 0) return null;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan", "lifetime");

  if (error || count === null) return null;

  return Math.max(total - count, 0);
}
