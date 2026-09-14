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

  // getUser() (não getClaims()) de propósito: getClaims() só decodifica o
  // token localmente, sem confirmar com o servidor da Supabase — em um
  // caso raro (sessão expirada mas o token de acesso ainda "parece" válido
  // por mais alguns minutos), ele dizia "logado" enquanto o resto do app
  // (que usa getUser() em getCurrentMembership()) dizia "não logado",
  // causando um loop infinito de redirecionamento entre /app e /app/entrar.
  // getUser() renova o token quando necessário, igual o getClaims() fazia.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

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
