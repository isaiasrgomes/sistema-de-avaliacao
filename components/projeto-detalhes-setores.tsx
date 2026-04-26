import type { Projeto } from "@/lib/types/database";

function valor(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "Não informado";
  return String(v);
}

export function ProjetoDetalhesSetores({ projeto }: { projeto: Projeto }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor 1 - Dados Gerais</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p><strong>Responsável:</strong> {valor(projeto.nome_responsavel)}</p>
          <p><strong>E-mail:</strong> {valor(projeto.email_responsavel)}</p>
          <p><strong>Telefone:</strong> {valor(projeto.telefone)}</p>
          <p><strong>CPF:</strong> {valor(projeto.cpf_responsavel)}</p>
          <p><strong>CNPJ:</strong> {valor(projeto.cnpj)}</p>
          <p><strong>Localização:</strong> {valor(projeto.municipio)} - {valor(projeto.uf)}</p>
          <p><strong>Fase:</strong> {valor(projeto.fase)}</p>
          <p><strong>Categoria:</strong> {valor(projeto.categoria_setor)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor 2 - Equipe Empreendedora</p>
        <div className="mt-2 space-y-2">
          <p><strong>Descrição da equipe:</strong> {valor(projeto.equipe_descricao)}</p>
          <p><strong>Quantidade de membros:</strong> {valor(projeto.equipe_quantidade_membros)}</p>
          <p><strong>Tempo dedicado:</strong> {valor(projeto.equipe_tempo_dedicacao)}</p>
          <p><strong>Participa de encontros obrigatórios:</strong> {valor(projeto.equipe_participa_encontros)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor 3 - Problema e Mercado</p>
        <div className="mt-2 space-y-2">
          <p><strong>Problema/oportunidade:</strong> {valor(projeto.mercado_problema)}</p>
          <p><strong>Conversou com potenciais clientes:</strong> {valor(projeto.mercado_conversou_clientes)}</p>
          <p><strong>Perfil dos primeiros clientes:</strong> {valor(projeto.mercado_perfil_clientes)}</p>
          <p><strong>Estimativa de público:</strong> {valor(projeto.mercado_estimativa_publico)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor 4 - Tecnologia e Diferencial</p>
        <div className="mt-2 space-y-2">
          <p><strong>Diferencial:</strong> {valor(projeto.tecnologia_diferencial)}</p>
          <p><strong>Setor de aplicação:</strong> {valor(projeto.setor_aplicacao_lista)}</p>
          {projeto.setor_aplicacao_lista === "Outro" ? (
            <p><strong>Outro setor:</strong> {valor(projeto.setor_aplicacao_outro)}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
