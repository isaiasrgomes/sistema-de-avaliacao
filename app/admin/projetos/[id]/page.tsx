import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils/status";
import { ProjetoDetalhesSetores } from "@/components/projeto-detalhes-setores";

function statusBadgeClass(status: string) {
  switch (status) {
    case "INSCRITO":
      return "border-slate-500/35 bg-slate-500/10 text-slate-700 dark:border-slate-300/35 dark:bg-slate-200/10 dark:text-slate-200";
    case "DESCLASSIFICADO":
      return "border-rose-500/35 bg-rose-500/10 text-rose-700 dark:border-rose-300/40 dark:bg-rose-300/15 dark:text-rose-200";
    case "EM_AVALIACAO":
      return "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200";
    case "AGUARDANDO_3O_AVALIADOR":
      return "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:border-orange-300/40 dark:bg-orange-300/15 dark:text-orange-200";
    case "AVALIADO":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-200";
    default:
      return "border-muted-foreground/30 bg-muted/40 text-foreground dark:border-muted-foreground/40 dark:bg-muted/30 dark:text-foreground";
  }
}

export default async function AdminProjetoDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: projeto } = await supabase.from("projetos").select("*").eq("id", params.id).single();

  if (!projeto) return <p>Projeto não encontrado.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{projeto.nome_projeto}</h1>
          <Badge variant="outline" className={statusBadgeClass(projeto.status)}>
            {getStatusLabel(projeto.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/projetos#${projeto.id}`}>Voltar para lista</Link>
          </Button>
        </div>

        <div className="space-y-3">
          <ProjetoDetalhesSetores projeto={projeto} />
          <p className="text-sm">
            <strong>Vídeo pitch:</strong>{" "}
            {projeto.url_video_pitch ? (
              <a href={projeto.url_video_pitch} className="text-primary underline" target="_blank" rel="noreferrer">
                abrir link
              </a>
            ) : (
              "Não informado"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

