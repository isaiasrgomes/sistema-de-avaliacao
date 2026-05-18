import { createServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { AvaliadoresClient } from "./avaliadores-client";

export default async function AvaliadoresPage() {
  const supabase = await createServerSupabase();
  const { data: avaliadores } = await supabase.from("avaliadores").select("*").order("nome");

  const { data: pendentes } = await supabase
    .from("profiles")
    .select("id, nome, email, criado_em")
    .eq("role", "AVALIADOR")
    .eq("cadastro_aprovado", false)
    .eq("cadastro_recusado", false)
    .order("criado_em", { ascending: false });

  const comCarga = await Promise.all(
    (avaliadores ?? []).map(async (a) => {
      const [{ count }, { count: countFinalizadas }] = await Promise.all([
        supabase
          .from("atribuicoes")
          .select("*", { count: "exact", head: true })
          .eq("avaliador_id", a.id)
          .in("status", ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]),
        supabase.from("atribuicoes").select("*", { count: "exact", head: true }).eq("avaliador_id", a.id).eq("status", "CONCLUIDA"),
      ]);
      return { ...a, carga: count ?? 0, avaliacoes_finalizadas: countFinalizadas ?? 0 };
    })
  );
  const integrations = {
    supabaseAdmin: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliadores"
        description="Aprove cadastros, gerencie avaliadores e envie comunicações. O e-mail do cadastro deve ser o mesmo usado no login."
      />
      <AvaliadoresClient initial={comCarga} cadastrosPendentes={pendentes ?? []} integrations={integrations} />
    </div>
  );
}
