"use client";

import { useEffect } from "react";
import { getNormalizedBasePath, withAppBasePath } from "@/lib/auth/auth-redirect-url";

/** Supabase cai na Site URL (/) com #access_token quando redirect_to não está nas Redirect URLs. */
function isLikelyAppRoot(pathname: string): boolean {
  const base = getNormalizedBasePath();
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  if (!base) return p === "/";
  return p === base;
}

export function RootAuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, hash, origin } = window.location;
    if (!hash || hash.length <= 1) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return;

    if (!isLikelyAppRoot(pathname)) return;

    const type = (params.get("type") || "").toLowerCase();
    const nextDefault = "/avaliador";
    const nextPath = type === "recovery" ? "/redefinir-senha" : nextDefault;

    const callback = `${origin}${withAppBasePath("/auth/callback")}?next=${encodeURIComponent(nextPath)}${hash}`;
    window.location.replace(callback);
  }, []);

  return null;
}
