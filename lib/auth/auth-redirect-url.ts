function normalizeBasePath(basePath: string) {
  const trimmed = basePath.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed.replace(/\/$/, "") : `/${trimmed.replace(/\/$/, "")}`;
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

export function buildAuthCallbackUrl(next: string) {
  const origin = resolveOrigin();
  if (!origin) return "";

  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");
  const callbackPath = `${basePath}/auth/callback`;
  return `${origin}${callbackPath}?next=${encodeURIComponent(next)}`;
}
