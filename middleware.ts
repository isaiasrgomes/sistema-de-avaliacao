import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAX_SINGLE_HEADER_BYTES = 16 * 1024;
const MAX_TOTAL_HEADERS_BYTES = 32 * 1024;

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("sb-")) continue;
    response.cookies.set({
      name: cookie.name,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
}

function getByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function hasOversizedHeaders(request: NextRequest) {
  let total = 0;
  for (const [name, value] of request.headers.entries()) {
    const lineSize = getByteLength(name) + 2 + getByteLength(value);
    if (lineSize > MAX_SINGLE_HEADER_BYTES) return true;
    total += lineSize;
    if (total > MAX_TOTAL_HEADERS_BYTES) return true;
  }
  return false;
}

function hasOversizedCookies(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) return false;

  if (getByteLength(cookieHeader) > MAX_SINGLE_HEADER_BYTES) return true;
  if (request.cookies.getAll().some((cookie) => getByteLength(cookie.value) > 4096)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const oversizedHeaders = hasOversizedHeaders(request);
  const oversizedCookies = hasOversizedCookies(request);
  const oversizedAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token") && cookie.value.length > 2500);
  if (oversizedAuthCookie || oversizedHeaders || oversizedCookies) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("erro", "sessao-redefinida");
    const redirect = NextResponse.redirect(loginUrl);
    clearSupabaseAuthCookies(request, redirect);
    return redirect;
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return new NextResponse("Configuração incompleta: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const supabase = createServerClient(
    url,
    anon,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path === "/cadastro" || path.startsWith("/cadastro/")) {
    if (!user) {
      return response;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cadastro_aprovado, cadastro_recusado")
      .eq("id", user.id)
      .single();
    if (profile?.role === "COORDENADOR") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (profile?.cadastro_recusado === true) {
      return NextResponse.redirect(new URL("/cadastro-recusado", request.url));
    }
    if (profile?.cadastro_aprovado === true) {
      return NextResponse.redirect(new URL("/avaliador", request.url));
    }
    return NextResponse.redirect(new URL("/aguardando-aprovacao", request.url));
  }

  if (path === "/cadastro-recusado" || path.startsWith("/cadastro-recusado/")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cadastro_aprovado, cadastro_recusado")
      .eq("id", user.id)
      .single();
    if (profile?.role === "COORDENADOR") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (profile?.cadastro_aprovado === true) {
      return NextResponse.redirect(new URL("/avaliador", request.url));
    }
    if (profile?.cadastro_recusado !== true) {
      return NextResponse.redirect(new URL("/aguardando-aprovacao", request.url));
    }
    return response;
  }

  if (path === "/aguardando-aprovacao" || path.startsWith("/aguardando-aprovacao/")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?next=/aguardando-aprovacao", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cadastro_aprovado, cadastro_recusado")
      .eq("id", user.id)
      .single();
    if (profile?.role === "COORDENADOR") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (profile?.cadastro_recusado === true) {
      return NextResponse.redirect(new URL("/cadastro-recusado", request.url));
    }
    if (profile?.cadastro_aprovado === true) {
      return NextResponse.redirect(new URL("/avaliador", request.url));
    }
    return response;
  }

  if (path.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?next=/admin", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "COORDENADOR") {
      return NextResponse.redirect(new URL("/avaliador", request.url));
    }
  }

  if (path.startsWith("/avaliador")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?next=/avaliador", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cadastro_aprovado, cadastro_recusado")
      .eq("id", user.id)
      .single();
    if (profile?.role === "COORDENADOR") {
      return response;
    }
    if (profile?.cadastro_recusado === true) {
      return NextResponse.redirect(new URL("/cadastro-recusado", request.url));
    }
    if (profile?.cadastro_aprovado !== true) {
      return NextResponse.redirect(new URL("/aguardando-aprovacao", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/avaliador/:path*",
    "/cadastro",
    "/cadastro/:path*",
    "/cadastro-recusado",
    "/cadastro-recusado/:path*",
    "/aguardando-aprovacao",
    "/aguardando-aprovacao/:path*",
  ],
};
