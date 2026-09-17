import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentMembership = {
  userId: string;
  email: string | undefined;
  organizationId: string;
  organizationName: string;
  role: "owner" | "manager" | "operator";
};

// A organização "atual" do usuário logado — por enquanto, uma pessoa
// pertence a uma única organização (o convite de equipe reusa o mesmo
// vínculo). Devolve `null` se não estiver logado ou não tiver organização.
export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data || !data.organizations) return null;

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  if (!org) return null;

  return {
    userId: user.id,
    email: user.email,
    organizationId: org.id,
    organizationName: org.name,
    role: data.role as CurrentMembership["role"],
  };
}

// Use no lugar de `if (!membership) redirect("/app/entrar")` em toda página
// que exige organização. Sessão válida sem vínculo ativo (ex.: removido da
// equipe) não pode só redirecionar pro login: como o proxy já vê a pessoa
// como logada, ele manda de volta pra cá assim que ela cair em
// /app/entrar — loop infinito até limpar os cookies do site na mão. Por
// isso essa função encerra a sessão antes de redirecionar.
export async function requireMembership(): Promise<CurrentMembership> {
  const membership = await getCurrentMembership();
  if (membership) return membership;

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/app/entrar?erro=sem_organizacao");
}
