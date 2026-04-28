import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { destinoAposLogin } from "@/lib/auth/destino-pos-login";
import { withAppBasePath } from "@/lib/auth/auth-redirect-url";

export async function GET(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/avaliador";
  const next = nextRaw.startsWith("/") ? nextRaw : "/avaliador";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL(withAppBasePath("/login"), url.origin);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    const loginUrl = new URL(withAppBasePath("/login"), url.origin);
    loginUrl.searchParams.set("error", "Link inválido ou expirado. Peça um novo magic link ou use senha.");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, cadastro_aprovado, cadastro_recusado")
    .eq("id", user.id)
    .single();

  const dest = destinoAposLogin(profile?.role, profile?.cadastro_aprovado, next, profile?.cadastro_recusado);
  const redirectUrl = new URL(withAppBasePath(dest), url.origin);
  const redirectResponse = NextResponse.redirect(redirectUrl, { status: 303 });
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}
