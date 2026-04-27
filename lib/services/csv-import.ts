import type { SupabaseClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import type { ProjetoFase, ProjetoStatus } from "@/lib/types/database";
import { validarCPF } from "@/lib/utils/documentos";
import { UFS_BRASIL } from "@/lib/constants/brasil";
import { corrigirMunicipioPeloCatalogo } from "@/lib/utils/municipios";

export interface ImportResult {
  inseridos: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
}

function norm(s: string | undefined | null) {
  return (s ?? "").trim();
}

function normalizeHeaderKey(h: string) {
  return norm(h)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function limitarCampo(valor: string, max: number) {
  return valor.length > max ? valor.slice(0, max) : valor;
}

function normalizarCategoriaSetor(valor: string) {
  return norm(valor).split(",")[0]?.trim() ?? "";
}

function parseQuantidadeMembros(valor: string): number | null {
  const d = somenteDigitos(valor);
  if (!d) return null;
  const n = Number(d);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function mapHeader(h: string) {
  const k = normalizeHeaderKey(h);
  const aliases: Record<string, string> = {
    nome_do_projeto: "nome_projeto",
    nome_projeto_startup: "nome_projeto",
    nome_projeto: "nome_projeto",
    projeto: "nome_projeto",
    nome_completo_do_responsavel: "nome_responsavel",
    nome_completo_do_proponente: "nome_responsavel",
    nome_responsável: "nome_responsavel",
    nome_responsavel: "nome_responsavel",
    responsável: "nome_responsavel",
    telefone_de_contato_whatsapp_preferencialmente_um_numero_com_whatsapp_ativo_pois_sera_nosso_principal_canal_de_comunicacao:
      "telefone",
    email_do_responsavel: "email_responsavel",
    e_mail: "email_responsavel",
    email: "email_responsavel",
    "e-mail": "email_responsavel",
    telefone: "telefone",
    cpf: "cpf_responsavel",
    cpf_responsavel: "cpf_responsavel",
    caso_a_resposta_para_o_item_anterior_seja_sim_informar_o_cnpj: "cnpj",
    cnpj: "cnpj",
    municipio_sede_do_projeto_ou_de_atuacao_da_equipe: "municipio",
    municipio_sede_do_projeto_ou_de_atuacao_da_equipe_ano_de_inicio_do_projeto: "municipio",
    município: "municipio",
    municipio: "municipio",
    uf: "uf",
    indique_o_setor_de_aplicacao_da_sua_solucao: "setor_aplicacao_lista",
    fase: "fase",
    categoria: "categoria_setor",
    categoria_setor: "categoria_setor",
    setor: "categoria_setor",
    video_do_link_para_o_pitch_ate_5_min_e_nao_obrigatorio: "url_video_pitch",
    url_vídeo: "url_video_pitch",
    url_video: "url_video_pitch",
    link_video: "url_video_pitch",
    carimbo_de_data_hora: "timestamp_submissao",
    timestamp: "timestamp_submissao",
    carimbo_datahora: "timestamp_submissao",
    descreva_a_equipe_nome_formacao_area_e_papel_de_cada_integrante: "equipe_descricao",
    quantidade_de_membros_na_equipe_incluindo_voce: "equipe_quantidade_membros",
    quanto_tempo_a_equipe_dedica_ou_dedicara_ao_projeto: "equipe_tempo_dedicacao",
    voce_ou_sua_equipe_pode_participar_de_encontros_obrigatorios_online_as_quartas_feiras:
      "equipe_participa_encontros",
    qual_problema_ou_necessidade_a_sua_solucao_busca_resolver: "mercado_problema",
    voce_ja_conversou_com_potenciais_clientes_sobre_esse_problema: "mercado_conversou_clientes",
    quem_seriam_seus_primeiros_clientes_descreva_o_perfil: "mercado_perfil_clientes",
    voce_tem_alguma_estimativa_de_quantas_pessoas_poderiam_se_interessar_pela_sua_solucao:
      "mercado_estimativa_publico",
    qual_e_o_estagio_de_maturidade_do_seu_projeto: "produto_maturidade",
    qual_e_o_estagio_de_maturidade_do_seu_projeto_: "produto_maturidade",
    estagio_de_maturidade_do_seu_projeto: "produto_maturidade",
    descreva_o_seu_produto_servico_ou_processo_com_mais_detalhes: "produto_descricao",
    descreva_o_seu_produto_servico_ou_processo_com_mais_detalhes_: "produto_descricao",
    produto_solucao_descricao: "produto_descricao",
    como_o_seu_produto_servico_se_diferencia_dos_demais_existentes: "tecnologia_diferencial",
    indique_o_setor_de_aplicacao_da_sua_solucao_dropdown: "setor_aplicacao_lista",
    setor_aplicacao_lista: "setor_aplicacao_lista",
    setor_aplicacao_outro: "setor_aplicacao_outro",
  };
  if (aliases[k]) return aliases[k];
  if (k.includes("nome_do_projeto") || k.includes("nome_projeto")) return "nome_projeto";
  if (k.includes("nome_completo_do_proponente") || k.includes("nome_responsavel")) return "nome_responsavel";
  if (k.startsWith("email")) return "email_responsavel";
  if (k.includes("telefone")) return "telefone";
  if (k.includes("cpf")) return "cpf_responsavel";
  if (k.includes("cnpj")) return "cnpj";
  if (k.includes("municipio")) return "municipio";
  if (k.includes("setor_de_aplicacao") || k.includes("categoria")) return "categoria_setor";
  if (k.includes("video") && k.includes("pitch")) return "url_video_pitch";
  if (k.includes("carimbo") || k.includes("timestamp") || k.includes("data_hora")) return "timestamp_submissao";
  if (k.includes("descreva_a_equipe") || k.includes("formacao_area") || k.includes("papel_de_cada_integrante")) return "equipe_descricao";
  if (k.includes("quantidade_de_membros_na_equipe")) return "equipe_quantidade_membros";
  if (k.includes("tempo_a_equipe_dedica")) return "equipe_tempo_dedicacao";
  if (k.includes("participar_de_encontros_obrigatorios")) return "equipe_participa_encontros";
  if (k.includes("problema_ou_necessidade") && k.includes("busca_resolver")) return "mercado_problema";
  if (k.includes("conversou_com_potenciais_clientes")) return "mercado_conversou_clientes";
  if (k.includes("primeiros_clientes") && k.includes("perfil")) return "mercado_perfil_clientes";
  if (k.includes("estimativa_de_quantas_pessoas")) return "mercado_estimativa_publico";
  if (k.includes("estagio_de_maturidade")) return "produto_maturidade";
  if (k.includes("produto_servico_ou_processo") && k.includes("mais_detalhes")) return "produto_descricao";
  if (k.includes("produto_servico") && k.includes("diferencia")) return "tecnologia_diferencial";
  if (k.includes("setor_de_aplicacao")) return "setor_aplicacao_lista";
  return k;
}

function parseFase(v: string): ProjetoFase {
  const u = norm(v).toUpperCase();
  if (u.includes("VALID")) return "VALIDACAO";
  return "IDEACAO";
}

function parseTimestamp(value: string) {
  const v = norm(value);
  if (!v) return null;
  const brDateTimeMatch = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (brDateTimeMatch) {
    const [, dd, mm, yyyy, hh = "0", min = "0", sec = "0"] = brDateTimeMatch;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hh.padStart(2, "0")}:${min.padStart(2, "0")}:${sec.padStart(2, "0")}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function importarCSVProjetos(
  supabase: SupabaseClient,
  csvText: string
): Promise<ImportResult> {
  const ufsSet = new Set(UFS_BRASIL);
  const erros: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: "",
  });

  if (parsed.errors.length) {
    erros.push(...parsed.errors.map((e) => e.message));
  }

  const { data: sertaoRows } = await supabase.from("municipios_sertao").select("municipio");
  const sertaoCatalogo = (sertaoRows ?? []).map((r) => norm(r.municipio)).filter(Boolean);
  const sertaoSet = new Set(sertaoCatalogo.map((m) => m.toLowerCase()));

  const rows = (parsed.data ?? []).map((raw) => {
    const o: Record<string, string> = {};
    for (const [hk, val] of Object.entries(raw)) {
      const key = mapHeader(hk);
      o[key] = norm(val);
    }
    return o;
  });

  const byNome = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    const n = norm(r.nome_projeto).toLowerCase();
    if (!n) continue;
    if (!byNome.has(n)) byNome.set(n, []);
    byNome.get(n)!.push(r);
  }
  for (const list of Array.from(byNome.values())) {
    if (list.length <= 1) continue;
    const distinctCpf = new Set(list.map((x) => x.cpf_responsavel));
    if (distinctCpf.size <= 1) continue;
    list.sort((a, b) => {
      const ta = new Date(a.timestamp_submissao || 0).getTime();
      const tb = new Date(b.timestamp_submissao || 0).getTime();
      return ta - tb;
    });
    const keep = list[0];
    for (const d of list.slice(1)) {
      const idx = rows.indexOf(d);
      if (idx >= 0) rows.splice(idx, 1);
    }
    void keep;
  }

  let inseridos = 0;
  let atualizados = 0;
  let ignorados = 0;

  for (const r of rows) {
    const nomeProjeto = limitarCampo(norm(r.nome_projeto), 255);
    const nomeResponsavel = limitarCampo(norm(r.nome_responsavel), 255);
    const emailResponsavel = limitarCampo(norm(r.email_responsavel), 255);
    const cpfResponsavel = somenteDigitos(norm(r.cpf_responsavel));
    const municipioFix = corrigirMunicipioPeloCatalogo(r.municipio, sertaoCatalogo);
    const municipio = limitarCampo(norm(municipioFix.municipio), 255);
    const categoriaSetor = normalizarCategoriaSetor(r.categoria_setor || r.setor_aplicacao_lista);
    const equipeQuantidadeMembros = parseQuantidadeMembros(r.equipe_quantidade_membros);

    const uf = (r.uf || "PE").toUpperCase();
    if (!ufsSet.has(uf as (typeof UFS_BRASIL)[number])) {
      erros.push(`UF inválida (${uf}) — projeto ${nomeProjeto || "?"}`);
      ignorados++;
      continue;
    }
    if (
      !nomeProjeto ||
      !nomeResponsavel ||
      !emailResponsavel ||
      !cpfResponsavel ||
      !municipio ||
      !categoriaSetor ||
      !r.equipe_descricao ||
      !equipeQuantidadeMembros ||
      !r.equipe_tempo_dedicacao ||
      !r.equipe_participa_encontros ||
      !r.mercado_problema ||
      !r.mercado_conversou_clientes ||
      !r.mercado_perfil_clientes ||
      !r.mercado_estimativa_publico ||
      !r.produto_maturidade ||
      !r.produto_descricao ||
      !r.tecnologia_diferencial ||
      !r.setor_aplicacao_lista ||
      !r.timestamp_submissao
    ) {
      erros.push(`Linha incompleta: ${nomeProjeto || cpfResponsavel || "?"}`);
      ignorados++;
      continue;
    }
    const parsedTimestamp = parseTimestamp(r.timestamp_submissao);
    if (!parsedTimestamp) {
      erros.push(`Data/hora inválida — projeto ${nomeProjeto || "?"}`);
      ignorados++;
      continue;
    }
    if (!validarCPF(cpfResponsavel)) {
      erros.push(`CPF inválido — projeto ${nomeProjeto || "?"}`);
      ignorados++;
      continue;
    }
    const cnpj = norm(r.cnpj);
    const telefone = norm(r.telefone);
    const urlVideoPitch = norm(r.url_video_pitch);

    const isSertao = sertaoSet.has(municipio.toLowerCase());
    const payload = {
      nome_projeto: nomeProjeto,
      nome_responsavel: nomeResponsavel,
      email_responsavel: emailResponsavel,
      telefone,
      cpf_responsavel: cpfResponsavel,
      cnpj,
      municipio,
      uf,
      fase: parseFase(r.fase || "IDEACAO"),
      categoria_setor: categoriaSetor,
      equipe_descricao: norm(r.equipe_descricao),
      equipe_quantidade_membros: equipeQuantidadeMembros,
      equipe_tempo_dedicacao: norm(r.equipe_tempo_dedicacao),
      equipe_participa_encontros: norm(r.equipe_participa_encontros),
      mercado_problema: norm(r.mercado_problema),
      mercado_conversou_clientes: norm(r.mercado_conversou_clientes),
      mercado_perfil_clientes: norm(r.mercado_perfil_clientes),
      mercado_estimativa_publico: norm(r.mercado_estimativa_publico),
      produto_maturidade: norm(r.produto_maturidade),
      produto_descricao: norm(r.produto_descricao),
      tecnologia_diferencial: norm(r.tecnologia_diferencial),
      setor_aplicacao_lista: norm(r.setor_aplicacao_lista),
      setor_aplicacao_outro: norm(r.setor_aplicacao_outro),
      is_sertao: isSertao,
      url_video_pitch: urlVideoPitch ? limitarCampo(urlVideoPitch, 2000) : null,
      timestamp_submissao: parsedTimestamp,
      status: "INSCRITO" as ProjetoStatus,
    };

    const { data: existing } = await supabase
      .from("projetos")
      .select("id")
      .eq("cpf_responsavel", cpfResponsavel)
      .eq("nome_projeto", nomeProjeto)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("projetos").update(payload).eq("id", existing.id);
      if (error) erros.push(error.message);
      else atualizados++;
    } else {
      const { error } = await supabase.from("projetos").insert(payload);
      if (error) erros.push(error.message);
      else inseridos++;
    }
  }

  return { inseridos, atualizados, ignorados, erros };
}
