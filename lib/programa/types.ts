import type { ConfigPrazo } from "@/lib/prazo-avaliacoes";
import type { ProgramaStatus, ProgramaTipo, ResultadoStatusFinal } from "@/lib/types/database";

export type Programa = {
  id: string;
  nome: string;
  tipo: ProgramaTipo;
  edital: string;
  status: ProgramaStatus;
  data_inicio: string;
  data_fim: string;
  avaliacoes_inicio: string | null;
  avaliacoes_fim: string | null;
  prorrogacao_fim: string | null;
  prorrogacao_utilizada: boolean;
  data_finalizacao: string | null;
  total_vagas: number;
  avaliadores_por_projeto: number;
  deleted_at: string | null;
  criado_em: string;
};

export type ProgramaResultadoFinalRow = {
  id: string;
  programa_id: string;
  projeto_id: string;
  nome_projeto: string;
  nome_responsavel: string;
  municipio: string;
  is_sertao: boolean;
  nota_final: number;
  media_equipe: number;
  media_mercado: number;
  media_produto: number;
  media_tecnologia: number;
  posicao_ranking: number | null;
  posicao_sertao: number | null;
  status_final: ResultadoStatusFinal;
  enquadramento_cota: boolean;
  criado_em: string;
};

export function programaParaConfigPrazo(p: Programa): ConfigPrazo {
  return {
    avaliacoes_inicio: p.avaliacoes_inicio,
    avaliacoes_fim: p.avaliacoes_fim,
    prorrogacao_fim: p.prorrogacao_fim,
    prorrogacao_utilizada: p.prorrogacao_utilizada,
  };
}

export function labelTipoPrograma(tipo: ProgramaTipo) {
  return tipo === "INCUBACAO" ? "Incubação" : "Pré-Incubação";
}

export function labelStatusPrograma(status: ProgramaStatus) {
  return status === "FINALIZADO" ? "Finalizado" : "Em processo";
}
