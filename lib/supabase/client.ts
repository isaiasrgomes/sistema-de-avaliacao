import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Avoid PKCE verifier dependency for magic links opened outside the original tab/app context.
        flowType: "implicit",
      },
    }
  );
}
