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
