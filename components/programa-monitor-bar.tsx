import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { labelTipoPrograma, type Programa } from "@/lib/programa/types";

export function ProgramaMonitorBar({ programa }: { programa: Programa }) {
  const readonly = programa.status === "FINALIZADO";

  return (
    <SectionCard className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Programa em monitoramento</p>
        <p className="truncate text-sm font-semibold text-foreground">{programa.nome}</p>
        <p className="text-xs text-muted-foreground">
          {labelTipoPrograma(programa.tipo)} · {programa.edital}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={readonly ? "FINALIZADO" : "EM_PROCESSO"}
          label={readonly ? "Finalizado · somente leitura" : "Em processo"}
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/programas">Trocar programa</Link>
        </Button>
      </div>
    </SectionCard>
  );
}
