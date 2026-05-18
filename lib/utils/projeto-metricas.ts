import type { ProjetoStatus } from "@/lib/types/database";

/** Status atribuídos após avaliação e/ou fechamento do ranking. */
const STATUS_POS_AVALIACAO: ProjetoStatus[] = ["AVALIADO", "SELECIONADO", "SUPLENTE", "NAO_SELECIONADO"];

export function projetoTeveAvaliacaoEntregue(opts: {
  status: string;
  tem_alguma_avaliacao_entregue?: boolean;
  qtd_atribuicoes_concluidas?: number;
}): boolean {
  if (opts.tem_alguma_avaliacao_entregue || (opts.qtd_atribuicoes_concluidas ?? 0) > 0) return true;
  return STATUS_POS_AVALIACAO.includes(opts.status as ProjetoStatus);
}

export function projetoEmAvaliacaoAtiva(status: string): boolean {
  return status === "EM_AVALIACAO" || status === "AGUARDANDO_3O_AVALIADOR";
}
