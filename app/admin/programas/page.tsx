import { createServerSupabase } from "@/lib/supabase/server";
import { ProgramasClient } from "./programas-client";
import type { Programa } from "@/lib/programa/types";

export default async function AdminProgramasPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("programas")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ProgramasClient programas={(data ?? []) as Programa[]} />
    </div>
  );
}
