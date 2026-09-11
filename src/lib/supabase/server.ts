import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente do usuário logado, por requisição — respeita RLS (é o que a
// maior parte do sistema deve usar). Lê/escreve a sessão nos cookies.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado a partir de um Server Component (sem permissão para
            // escrever cookies) — o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}
