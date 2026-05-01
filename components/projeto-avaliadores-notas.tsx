import { Badge } from "@/components/ui/badge";
import { dispersaoRelativaPercentual, mediaNotasTotaisProjeto, notasTotaisParPrincipal } from "@/lib/services/nota";

type AvaliacaoRow = {
  nota_total_ponderada: number;
  nota_equipe: number;
  nota_mercado: number;
  nota_produto: number;
  nota_tecnologia: number;
};

export type AtribuicaoComAvaliacao = {
  id: string;
  ordem: number;
  status: string;
  avaliadores: { nome: string } | { nome: string }[] | null;
  avaliacoes: AvaliacaoRow | AvaliacaoRow[] | null;
};

function pickAvaliacao(av: AvaliacaoRow | AvaliacaoRow[] | null): AvaliacaoRow | null {
  if (!av) return null;
  return Array.isArray(av) ? av[0] ?? null : av;
}

function pickNomeAvaliador(av: AtribuicaoComAvaliacao["avaliadores"]): string {
  if (!av) return "Avaliador";
  const row = Array.isArray(av) ? av[0] : av;
  return row?.nome?.trim() || "Avaliador";
}

export function ProjetoAvaliadoresNotas({ atribuicoes }: { atribuicoes: AtribuicaoComAvaliacao[] }) {
  const linhas = atribuicoes.map((a) => {
    const av = pickAvaliacao(a.avaliacoes);
    const concluiu = av != null;
    return { ...a, av, concluiu };
  });

  const notaByAtribId = new Map<string, number>();
  for (const x of linhas) {
    if (x.av?.nota_total_ponderada != null) {
      notaByAtribId.set(x.id, Number(x.av.nota_total_ponderada));
    }
  }
  const { media: mediaTotalPonderado, qtd: qtdNotasRecebidas } = mediaNotasTotaisProjeto(
    atribuicoes.map((a) => ({ id: a.id })),
    notaByAtribId
  );

  const totaisPar = notasTotaisParPrincipal(
    linhas.map((x) => ({
      ordem: x.ordem,
      status: x.status,
      notaTotal: x.av?.nota_total_ponderada != null ? Number(x.av.nota_total_ponderada) : null,
    }))
  );
  const dispersao = dispersaoRelativaPercentual(totaisPar);

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Avaliadores e notas</h2>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end">
          {mediaTotalPonderado != null && qtdNotasRecebidas > 0 && (
            <p>
              <span className="text-muted-foreground">Média (total ponderado): </span>
              <span className="font-semibold tabular-nums text-foreground">{mediaTotalPonderado.toFixed(2)}</span>
              <span className="text-muted-foreground"> · {qtdNotasRecebidas} nota(s)</span>
            </p>
          )}
          {dispersao != null && (
            <p>
              Dispersão entre 1º e 2º avaliador:{" "}
              <span className="font-medium tabular-nums text-foreground">{dispersao.toFixed(2)}%</span>
              <span className="text-muted-foreground"> — ((maior − menor) / média) × 100</span>
            </p>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {linhas.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/50 bg-card/60 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{pickNomeAvaliador(row.avaliadores)}</span>
              <span className="text-muted-foreground"> · ordem {row.ordem}</span>
              <span className="text-muted-foreground"> · {row.status}</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!row.concluiu ? (
                <Badge variant="secondary" className="shrink-0">
                  Não avaliou
                </Badge>
              ) : (
                <div className="text-right text-xs tabular-nums leading-snug">
                  <div>
                    <span className="text-muted-foreground">Total ponderado:</span>{" "}
                    <strong>{Number(row.av!.nota_total_ponderada).toFixed(2)}</strong>
                  </div>
                  <div className="text-muted-foreground">
                    Eq. {row.av!.nota_equipe} · Mc. {row.av!.nota_mercado} · Pr. {row.av!.nota_produto} · Tc.{" "}
                    {row.av!.nota_tecnologia}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
