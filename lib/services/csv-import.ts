import type { SupabaseClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import type { ProjetoFase, ProjetoStatus } from "@/lib/types/database";

export interface ImportResult {
  inseridos: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
}

function norm(s: string | undefined | null) {
  return (s ?? "").trim();
}

function mapHeader(h: string) {
  const k = norm(h).toLowerCase().replace(/\s+/g, "_");
  const aliases: Record<string, string> = {
    nome_do_projeto: "nome_projeto",
    "nome_projeto": "nome_projeto",
    projeto: "nome_projeto",
    nome_responsável: "nome_responsavel",
    nome_responsavel: "nome_responsavel",
    responsável: "nome_responsavel",
    e_mail: "email_responsavel",
    email: "email_responsavel",
    "e-mail": "email_responsavel",
    telefone: "telefone",
    cpf: "cpf_responsavel",
    cpf_responsavel: "cpf_responsavel",
    cnpj: "cnpj",
    município: "municipio",
    municipio: "municipio",
    uf: "uf",
    fase: "fase",
    categoria: "categoria_setor",
    categoria_setor: "categoria_setor",
    setor: "categoria_setor",
    url_vídeo: "url_video_pitch",
    url_video: "url_video_pitch",
    link_video: "url_video_pitch",
    timestamp: "timestamp_submissao",
    carimbo_datahora: "timestamp_submissao",
  };
  return aliases[k] ?? k;
}

function parseFase(v: string): ProjetoFase {
  const u = norm(v).toUpperCase();
  if (u.includes("VALID")) return "VALIDACAO";
  return "IDEACAO";
}

export async function importarCSVProjetos(
  supabase: SupabaseClient,
  csvText: string
): Promise<ImportResult> {
  const erros: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    erros.push(...parsed.errors.map((e) => e.message));
  }

  const { data: sertaoRows } = await supabase.from("municipios_sertao").select("municipio");
  const sertaoSet = new Set((sertaoRows ?? []).map((r) => norm(r.municipio).toLowerCase()));

  const rows = (parsed.data ?? []).map((raw) => {
    const o: Record<string, string> = {};
    for (const [hk, val] of Object.entries(raw)) {
      const key = mapHeader(hk);
      o[key] = norm(val);
    }
    return o;
  });

  const byCpf = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    const cpf = r.cpf_responsavel;
    if (!cpf) continue;
    if (!byCpf.has(cpf)) byCpf.set(cpf, []);
    byCpf.get(cpf)!.push(r);
  }

  for (const list of Array.from(byCpf.values())) {
    if (list.length <= 1) continue;
    list.sort((a, b) => {
      const ta = new Date(a.timestamp_submissao || 0).getTime();
      const tb = new Date(b.timestamp_submissao || 0).getTime();
      return tb - ta;
    });
    const keep = list[0];
    const drop = list.slice(1);
    for (const d of drop) {
      const idx = rows.indexOf(d);
      if (idx >= 0) rows.splice(idx, 1);
    }
    void keep;
  }

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
    const uf = (r.uf || "PE").toUpperCase();
    if (uf !== "PE") {
      erros.push(`UF inválida (${uf}) — projeto ${r.nome_projeto || "?"}`);
      ignorados++;
      continue;
    }
    if (
      !r.nome_projeto ||
      !r.nome_responsavel ||
      !r.email_responsavel ||
      !r.cpf_responsavel ||
      !r.municipio ||
      !r.categoria_setor ||
      !r.timestamp_submissao
    ) {
      erros.push(`Linha incompleta: ${r.nome_projeto || r.cpf_responsavel || "?"}`);
      ignorados++;
      continue;
    }

    const isSertao = sertaoSet.has(norm(r.municipio).toLowerCase());
    const payload = {
      nome_projeto: r.nome_projeto,
      nome_responsavel: r.nome_responsavel,
      email_responsavel: r.email_responsavel,
      telefone: r.telefone || null,
      cpf_responsavel: r.cpf_responsavel,
      cnpj: r.cnpj || null,
      municipio: r.municipio,
      uf: "PE",
      fase: parseFase(r.fase || "IDEACAO"),
      categoria_setor: r.categoria_setor,
      is_sertao: isSertao,
      url_video_pitch: r.url_video_pitch || null,
      timestamp_submissao: new Date(r.timestamp_submissao).toISOString(),
      status: "INSCRITO" as ProjetoStatus,
    };

    const { data: existing } = await supabase
      .from("projetos")
      .select("id")
      .eq("cpf_responsavel", r.cpf_responsavel)
      .eq("nome_projeto", r.nome_projeto)
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
