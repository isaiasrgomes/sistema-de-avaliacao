import type { Projeto } from "@/lib/types/database";
import { SETOR_APLICACAO_OPTIONS } from "@/lib/constants/projeto-inscricao";

function valor(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "Não informado";
  return String(v);
}

function renderTextoEmLista(value: string | number | null | undefined) {
  const s = value === null || value === undefined ? "" : String(value).trim();
  if (!s) return <span>Não informado</span>;

  const normalized = s.replace(/\s+/g, " ");

  const slashItens = normalized.split("/").map((x) => x.trim()).filter(Boolean);
  if (slashItens.length >= 3) {
    return (
      <ul className="list-disc space-y-0.5 pl-5">
        {slashItens.map((it) => (
          <li key={it} className="leading-relaxed">
            {it}
          </li>
        ))}
      </ul>
    );
  }

  return <span className="leading-relaxed">{normalized}</span>;
}

function renderSetorAplicacaoLista(value: string | null | undefined) {
  const s = (value ?? "").trim();
  if (!s) return <span>Não informado</span>;

  function normKey(x: string) {
    return x
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s*&\s*/g, " & ")
      .trim();
  }

  const raw = normKey(s);

  // Ordena e exibe exatamente conforme as opções oficiais do formulário.
  // Detecta seleção mesmo quando o valor vem concatenado (Forms) ou parcialmente truncado.
  const selected: string[] = [];
  for (const opt of SETOR_APLICACAO_OPTIONS) {
    const optNorm = normKey(opt);
    if (optNorm === "outro") {
      if (raw.includes("outro")) selected.push("Outro");
      continue;
    }

    const title = opt.split("—")[0]?.trim() ?? opt;
    const titleNorm = normKey(title);

    // Match por título (parte antes do travessão), ou por segmento de Tech (ex: "(AgTech / ClimateTech)").
    const techMatch = (opt.match(/\(([^)]+)\)/)?.[1] ?? "")
      .split("/")
      .map((x) => normKey(x))
      .filter(Boolean);

    const hitTitle = raw.includes(titleNorm);
    const hitTech = techMatch.some((t) => t && raw.includes(t));

    if (hitTitle || hitTech) selected.push(opt);
  }

  const items = selected.length ? selected : [s.replace(/\s+/g, " ").trim()];

  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {items.map((it, idx) => (
        <li key={`${idx}-${it}`} className="leading-relaxed">
          {it}
        </li>
      ))}
    </ul>
  );
}

export function ProjetoDetalhesSetores({ projeto }: { projeto: Projeto }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor 1 - Dados Gerais</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p><strong>Responsável:</strong> {valor(projeto.nome_responsavel)}</p>
          <p><strong>E-mail:</strong> {valor(projeto.email_responsavel)}</p>
          {/*<p><strong>Telefone:</strong> {valor(projeto.telefone)}</p>*/}
          {/*<p><strong>CPF:</strong> {valor(projeto.cpf_responsavel)}</p>*/}
          <p><strong>CNPJ:</strong> {valor(projeto.cnpj)}</p>
          <p><strong>Localização:</strong> {valor(projeto.municipio)} - {valor(projeto.uf)}</p>
          <p><strong>Fase:</strong> {valor(projeto.fase)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critério 1 - Equipe empreendedora</p>
        <div className="mt-2 space-y-2">
          <p><strong>Descreva a equipe (nome, formação/área e papel de cada integrante): </strong> {valor(projeto.equipe_descricao)}</p>
          <p><strong>Quantidade de membros na equipe (incluindo você):</strong> {valor(projeto.equipe_quantidade_membros)}</p>
          <p><strong>Quanto tempo a equipe dedica ou dedicará ao projeto?:</strong> {valor(projeto.equipe_tempo_dedicacao)}</p>
          <p><strong>Você ou sua equipe pode participar de encontros obrigatórios (online) às quartas-feiras? </strong> {valor(projeto.equipe_participa_encontros)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critério 2 - Problema e oportunidade de mercado</p>
        <div className="mt-2 space-y-2">
          <p><strong>Qual problema ou necessidade a sua solução busca resolver? </strong> {valor(projeto.mercado_problema)}</p>
          <p><strong>Você já conversou com potenciais clientes sobre esse problema? </strong> {valor(projeto.mercado_conversou_clientes)}</p>
          <p><strong>Quem seriam seus primeiros clientes? Descreva o perfil. </strong> {valor(projeto.mercado_perfil_clientes)}</p>
          <p><strong>Você tem alguma estimativa de quantas pessoas poderiam se interessar pela sua solução?</strong> {valor(projeto.mercado_estimativa_publico)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critério 3 - Produto/Solução</p>
        <div className="mt-2 space-y-2">
          <p><strong> Qual é o estágio de maturidade do seu projeto?</strong> {valor(projeto.produto_maturidade)}</p>
          <p><strong> Qual é o estágio de maturidade do seu projeto?</strong> {valor(projeto.produto_descricao)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critério 4 - Tecnologia e diferencial</p>
        <div className="mt-2 space-y-2">
          <p><strong>Como o seu produto/serviço se diferencia dos demais existentes?</strong> {valor(projeto.tecnologia_diferencial)}</p>
          <div>
            <p>
              <strong>Indique o setor de aplicação da sua solução:</strong>
            </p>
            {renderSetorAplicacaoLista(projeto.setor_aplicacao_lista)}
          </div>
          {projeto.setor_aplicacao_lista === "Outro" ? (
            <p><strong>Outro setor:</strong> {valor(projeto.setor_aplicacao_outro)}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
