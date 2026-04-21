/** Config vinda de `app_config` (linha id=1). */
export type ConfigPrazo = {
  avaliacoes_inicio: string | null;
  avaliacoes_fim: string | null;
  prorrogacao_fim: string | null;
  prorrogacao_utilizada: boolean;
};

/** Data/hora final efetiva: prorrogação substitui o fim original quando existir. */
export function prazoFimEfetivo(cfg: ConfigPrazo): Date | null {
  const fim = cfg.prorrogacao_fim ?? cfg.avaliacoes_fim;
  if (!fim) return null;
  const d = new Date(fim);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function prazoInicio(cfg: ConfigPrazo): Date | null {
  if (!cfg.avaliacoes_inicio) return null;
  const d = new Date(cfg.avaliacoes_inicio);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Se não há datas configuradas, não bloqueia. */
export function podeEnviarAvaliacaoAgora(cfg: ConfigPrazo, agora = new Date()): { ok: boolean; motivo?: string } {
  const ini = prazoInicio(cfg);
  const fim = prazoFimEfetivo(cfg);
  if (ini && agora < ini) {
    return { ok: false, motivo: `As avaliações abrem em ${ini.toLocaleString("pt-BR")}.` };
  }
  if (fim && agora > fim) {
    return { ok: false, motivo: `O prazo para avaliações encerrou em ${fim.toLocaleString("pt-BR")}.` };
  }
  return { ok: true };
}
