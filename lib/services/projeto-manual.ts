import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjetoFase, ProjetoStatus } from "@/lib/types/database";
import type { ProjetoManualInput } from "@/lib/validations/projeto-manual";
import { corrigirMunicipioPeloCatalogo } from "@/lib/utils/municipios";

function norm(s: string | null | undefined) {
  return (s ?? "").trim();
}

export type CadastroProjetoResult =
  | { ok: true; tipo: "inserido" | "atualizado"; projetoId: string }
  | { ok: false; erro: string };

export async function cadastrarOuAtualizarProjetoManual(
  supabase: SupabaseClient,
  input: ProjetoManualInput
): Promise<CadastroProjetoResult> {
  let ts: string;
  try {
    const d = new Date(input.timestamp_submissao);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, erro: "Data/hora de submissão inválida." };
    }
    ts = d.toISOString();
  } catch {
    return { ok: false, erro: "Data/hora de submissão inválida." };
  }

  const { data: sertaoRows } = await supabase.from("municipios_sertao").select("municipio");
  const sertaoCatalogo = (sertaoRows ?? []).map((r) => norm(r.municipio)).filter(Boolean);
  const municipioFix = corrigirMunicipioPeloCatalogo(input.municipio, sertaoCatalogo);
  const municipioCanonico = norm(municipioFix.municipio);
  const sertaoSet = new Set(sertaoCatalogo.map((m) => m.toLowerCase()));
  const isSertao = sertaoSet.has(municipioCanonico.toLowerCase());

  const payload = {
    nome_projeto: norm(input.nome_projeto),
    nome_responsavel: norm(input.nome_responsavel),
    email_responsavel: norm(input.email_responsavel).toLowerCase(),
    telefone: norm(input.telefone),
    cpf_responsavel: norm(input.cpf_responsavel),
    cnpj: norm(input.cnpj),
    municipio: municipioCanonico,
    uf: norm(input.uf).toUpperCase(),
    fase: input.fase as ProjetoFase,
    categoria_setor: norm(input.categoria_setor),
    equipe_descricao: norm(input.equipe_descricao),
    equipe_quantidade_membros: input.equipe_quantidade_membros,
    equipe_tempo_dedicacao: norm(input.equipe_tempo_dedicacao),
    equipe_participa_encontros: norm(input.equipe_participa_encontros),
    mercado_problema: norm(input.mercado_problema),
    mercado_conversou_clientes: norm(input.mercado_conversou_clientes),
    mercado_perfil_clientes: norm(input.mercado_perfil_clientes),
    mercado_estimativa_publico: norm(input.mercado_estimativa_publico),
    tecnologia_diferencial: norm(input.tecnologia_diferencial),
    setor_aplicacao_lista: norm(input.setor_aplicacao_lista),
    setor_aplicacao_outro: norm(input.setor_aplicacao_outro),
    is_sertao: isSertao,
    url_video_pitch: input.url_video_pitch ? norm(input.url_video_pitch) : null,
    timestamp_submissao: ts,
    status: "INSCRITO" as ProjetoStatus,
  };

  const { data: existing } = await supabase
    .from("projetos")
    .select("id")
    .eq("cpf_responsavel", payload.cpf_responsavel)
    .eq("nome_projeto", payload.nome_projeto)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("projetos").update(payload).eq("id", existing.id);
    if (error) return { ok: false, erro: error.message };
    return { ok: true, tipo: "atualizado", projetoId: existing.id };
  }

  const { data: inserted, error } = await supabase.from("projetos").insert(payload).select("id").single();
  if (error) return { ok: false, erro: error.message };
  return { ok: true, tipo: "inserido", projetoId: inserted!.id };
}
