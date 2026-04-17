import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(dest, url.origin), { status: 303 });
}

