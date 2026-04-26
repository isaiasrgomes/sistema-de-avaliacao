export type ProjetoFase = "IDEACAO" | "VALIDACAO";
export type ProjetoStatus =
  | "INSCRITO"
  | "DESCLASSIFICADO"
  | "EM_AVALIACAO"
  | "AGUARDANDO_3O_AVALIADOR"
  | "AVALIADO"
  | "SELECIONADO"
  | "SUPLENTE"
  | "NAO_SELECIONADO";

export type AtribuicaoStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
export type ResultadoStatusFinal = "SELECIONADO" | "SUPLENTE" | "NAO_SELECIONADO";
export type ProfileRole = "COORDENADOR" | "AVALIADOR";
export type ImpedimentoTipo = "SOCIETARIO" | "PROFISSIONAL" | "PARENTESCO" | "OUTRO";
export type DeclaradoPor = "AVALIADOR" | "COORDENADOR";
export type FasePublicacao = "PRELIMINAR" | "FINAL";

export interface Profile {
  id: string;
  role: ProfileRole;
  nome: string;
  email: string | null;
  cadastro_aprovado: boolean;
  cadastro_recusado: boolean;
  criado_em: string;
}

export interface Projeto {
  id: string;
  nome_projeto: string;
  nome_responsavel: string;
  email_responsavel: string;
  telefone: string | null;
  cpf_responsavel: string;
  cnpj: string | null;
  municipio: string;
  uf: string;
  fase: ProjetoFase;
  categoria_setor: string;
  equipe_descricao: string | null;
  equipe_quantidade_membros: number | null;
  equipe_tempo_dedicacao: string | null;
  equipe_participa_encontros: string | null;
  mercado_problema: string | null;
  mercado_conversou_clientes: string | null;
  mercado_perfil_clientes: string | null;
  mercado_estimativa_publico: string | null;
  tecnologia_diferencial: string | null;
  setor_aplicacao_lista: string | null;
  setor_aplicacao_outro: string | null;
  is_sertao: boolean;
  url_video_pitch: string | null;
  timestamp_submissao: string;
  status: ProjetoStatus;
  motivo_desclassificacao: string | null;
  criado_em: string;
}

export interface Avaliador {
  id: string;
  nome: string;
  email: string;
  instituicao: string | null;
  ativo: boolean;
  aceite_confidencialidade: boolean;
  aceite_em: string | null;
  criado_em: string;
}

export interface Atribuicao {
  id: string;
  avaliador_id: string;
  projeto_id: string;
  ordem: number;
  status: AtribuicaoStatus;
  data_atribuicao: string;
  data_conclusao: string | null;
}

export interface Impedimento {
  id: string;
  avaliador_id: string;
  projeto_id: string;
  tipo: ImpedimentoTipo;
  declarado_por: DeclaradoPor;
  justificativa: string | null;
  data_declaracao: string;
}

export interface Avaliacao {
  id: string;
  atribuicao_id: string;
  nota_equipe: number;
  nota_mercado: number;
  nota_produto: number;
  nota_tecnologia: number;
  justificativa_geral: string | null;
  observacoes_gerais: string | null;
  nota_total_ponderada: number;
  data_avaliacao: string;
}

export interface Resultado {
  id: string;
  projeto_id: string;
  nota_final: number;
  media_equipe: number;
  media_mercado: number;
  media_produto: number;
  media_tecnologia: number;
  posicao_geral: number | null;
  posicao_sertao: number | null;
  status_final: ResultadoStatusFinal;
  enquadramento_cota: boolean;
  gerado_em: string;
}
