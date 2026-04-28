function normalizeBasePath(basePath: string) {
  const trimmed = basePath.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed.replace(/\/$/, "") : `/${trimmed.replace(/\/$/, "")}`;
}

export function getNormalizedBasePath() {
  return normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");
}

function resolveOrigin() {
  if (typeof window !== "undefined") {
    // In dev, keep callback on same origin to preserve PKCE verifier storage.
    if (process.env.NODE_ENV !== "production") {
      return window.location.origin;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

/** Caminho absoluto no site (inclui `NEXT_PUBLIC_BASE_PATH` quando existir). */
export function withAppBasePath(path: string) {
  const basePath = getNormalizedBasePath();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}

/** URL absoluta do callback de auth (uso em servidor com origem fixa do deploy). */
export function buildAuthCallbackUrlWithOrigin(origin: string, next: string) {
  const o = origin.replace(/\/$/, "");
  if (!o) return "";
  const callbackPath = withAppBasePath("/auth/callback");
  return `${o}${callbackPath}?next=${encodeURIComponent(next)}`;
}

export function buildAuthCallbackUrl(next: string) {
  const origin = resolveOrigin();
  if (!origin) return "";
  return buildAuthCallbackUrlWithOrigin(origin, next);
}
