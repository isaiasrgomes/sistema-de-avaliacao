/** Nota ponderada (20–100) conforme edital */
export function calcularNotaPonderada(
  nota_equipe: number,
  nota_mercado: number,
  nota_produto: number,
  nota_tecnologia: number
) {
  return nota_equipe * 6 + nota_mercado * 6 + nota_produto * 4 + nota_tecnologia * 4;
}

export type LinhaNotaParPrincipal = {
  ordem: number;
  status: string;
  notaTotal: number | null;
};

/**
 * Notas totais ponderadas só do par principal (ordens 1 e 2), ambas concluídas com avaliação.
 * O 3º avaliador (ordem ≥ 3) não entra na dispersão usada no ranking nem na regra de CV.
 */
export function notasTotaisParPrincipal(linhas: LinhaNotaParPrincipal[]): number[] {
  const totais: number[] = [];
  for (const ord of [1, 2] as const) {
    const hit = linhas.find((l) => l.ordem === ord && l.notaTotal != null && !Number.isNaN(l.notaTotal));
    if (hit?.notaTotal != null) totais.push(Number(hit.notaTotal));
  }
  return totais;
}

/** Média das notas totais ponderadas recebidas (uma entrada em `avaliacoes` por atribuição). */
export function mediaNotasTotaisProjeto(
  atribs: { id: string }[],
  notaByAtribId: Map<string, number>
): { media: number | null; qtd: number } {
  const vals: number[] = [];
  for (const a of atribs) {
    const n = notaByAtribId.get(a.id);
    if (n != null && !Number.isNaN(n)) vals.push(n);
  }
  if (vals.length === 0) return { media: null, qtd: 0 };
  return { media: vals.reduce((s, v) => s + v, 0) / vals.length, qtd: vals.length };
}

/**
 * Dispersão relativa entre notas totais ponderadas (mesmo projeto, critério agregado):
 * ((maior − menor) / média) × 100, com média aritmética das notas consideradas.
 * Com exatamente duas notas, coincide com (|a − b| / ((a+b)/2)) × 100.
 */
export function dispersaoRelativaPercentual(totais: number[]): number | null {
  if (totais.length < 2) return null;
  const max = Math.max(...totais);
  const min = Math.min(...totais);
  const media = totais.reduce((s, v) => s + v, 0) / totais.length;
  if (media === 0) return 0;
  return ((max - min) / media) * 100;
}

/** Quantidade de notas recebidas + dispersão só do par ordem 1 e 2 (coluna “Dif. %”). */
export function qtdNotasEDispersaoParPrincipal(
  atribs: { id: string; ordem: number; status: string }[],
  notaByAtribId: Map<string, number>
): { qtdNotas: number; cvPct: number | null } {
  const linhas: LinhaNotaParPrincipal[] = [];
  for (const a of atribs) {
    const temNota = notaByAtribId.has(a.id);
    linhas.push({
      ordem: a.ordem,
      status: a.status,
      notaTotal: temNota ? notaByAtribId.get(a.id)! : null,
    });
  }
  const qtdNotas = linhas.filter((l) => l.notaTotal != null).length;
  const totaisPar = notasTotaisParPrincipal(linhas);
  return { qtdNotas, cvPct: dispersaoRelativaPercentual(totaisPar) };
}

export function coeficienteVariacaoDoisValores(a: number, b: number): number {
  return dispersaoRelativaPercentual([a, b]) ?? 0;
}
