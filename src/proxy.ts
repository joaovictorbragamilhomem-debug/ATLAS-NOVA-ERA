import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_APP_PATHS = [
  "/app/entrar",
  "/app/cadastro",
  "/app/esqueci-senha",
  "/app/redefinir-senha",
  "/app/verificar-email",
];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getClaims() valida a sessão e renova o token quando necessário —
  // sem isso, a sessão do usuário pode expirar de forma imprevisível.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  const { pathname } = request.nextUrl;
  const isPublicAppPath = PUBLIC_APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (pathname.startsWith("/app") && !isPublicAppPath && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/entrar";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublicAppPath && isLoggedIn && pathname !== "/app/redefinir-senha") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
