import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { labelTipoPrograma, type Programa } from "@/lib/programa/types";

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

export default async function HistoricoProgramasPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("programas")
    .select("*")
    .eq("status", "FINALIZADO")
    .is("deleted_at", null)
    .order("data_finalizacao", { ascending: false });

  const programas = (data ?? []) as Programa[];

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-8 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <SertaoMakerBrand variant="full" align="center" className="origin-center scale-110" />
        <h1 className="text-2xl font-semibold tracking-tight">Histórico de programas</h1>
        <p className="max-w-lg text-sm text-muted-foreground">
          Resultados finais de edições encerradas. Os dados permanecem armazenados permanentemente.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Voltar à página inicial</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {programas.map((p) => (
          <SectionCard key={p.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <h2 className="text-lg font-semibold">{p.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  {labelTipoPrograma(p.tipo)} · {p.edital}
                </p>
              </div>
              <StatusBadge status="FINALIZADO" label="Finalizado" />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>
                  Programa: {fmtDate(p.data_inicio)} — {fmtDate(p.data_fim)}
                </p>
                <p>Finalizado em: {fmtDate(p.data_finalizacao)}</p>
              </div>
              <Button asChild>
                <Link href={`/historico-programas/${p.id}`}>Ver resultado</Link>
              </Button>
            </div>
          </SectionCard>
        ))}
      </div>

      {programas.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhum programa finalizado publicado ainda.</p>
      ) : null}
    </main>
  );
}
