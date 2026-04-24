"use client";

import { useState } from "react";
import type { Avaliador } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  actionAprovarCadastroAvaliador,
  actionCreateAvaliador,
  actionDeleteAvaliador,
  actionImportarAvaliadoresCSV,
  actionRejeitarCadastroAvaliador,
  actionToggleAvaliador,
  actionUpdateAvaliador,
} from "@/app/actions/avaliadores-crud";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Row = Avaliador & { carga: number };

type Pendente = { id: string; nome: string; email: string | null; criado_em: string };
type Integrations = { supabaseAdmin: boolean; resend: boolean };

export function AvaliadoresClient({
  initial,
  cadastrosPendentes,
  integrations,
}: {
  initial: Row[];
  cadastrosPendentes: Pendente[];
  integrations: Integrations;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [inst, setInst] = useState("");
  const [csvText, setCsvText] = useState("");

  function baixarModeloCsv() {
    const modelo =
      "nome,email\nNome Exemplo,avaliador@exemplo.com\nOutro Avaliador,outro@exemplo.com\n";
    const blob = new Blob([modelo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-avaliadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <p className="text-sm font-medium text-foreground">Status das integrações</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge
            variant={integrations.supabaseAdmin ? "default" : "outline"}
            className={
              integrations.supabaseAdmin
                ? undefined
                : "border-destructive/50 bg-destructive/10 text-destructive"
            }
          >
            Supabase Admin: {integrations.supabaseAdmin ? "OK" : "Pendente"}
          </Badge>
          <Badge variant={integrations.resend ? "default" : "secondary"}>
            Resend (e-mail): {integrations.resend ? "OK" : "Não configurado"}
          </Badge>
        </div>
        {!integrations.supabaseAdmin && (
          <p className="mt-2 text-xs text-muted-foreground">
            Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor.
          </p>
        )}
        {!integrations.resend && (
          <p className="mt-1 text-xs text-muted-foreground">
            Configure <code>RESEND_API_KEY</code> e <code>EMAIL_FROM</code> para envio automático das credenciais.
          </p>
        )}
      </div>

      {cadastrosPendentes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5 shadow-sm">
          <div className="border-b border-amber-500/20 px-4 py-3">
            <p className="font-medium text-foreground">Cadastros aguardando aprovação</p>
            <p className="text-xs text-muted-foreground">
              Ao aprovar, o avaliador poderá entrar na área restrita e será criada ou atualizada a linha correspondente
              nesta lista. Se não aceitar o cadastro, a pessoa verá um aviso ao entrar e não terá acesso à avaliação.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cadastrosPendentes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>{p.email ?? "—"}</TableCell>
                  <TableCell>{new Date(p.criado_em).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await actionAprovarCadastroAvaliador(p.id);
                            toast.success("Cadastro aprovado.");
                            window.location.reload();
                          } catch (e: unknown) {
                            toast.error(e instanceof Error ? e.message : "Erro");
                          }
                        }}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Não aceitar este cadastro? A pessoa não poderá acessar a área do avaliador neste edital."
                            )
                          ) {
                            return;
                          }
                          try {
                            await actionRejeitarCadastroAvaliador(p.id);
                            toast.success("Cadastro não aceito.");
                            window.location.reload();
                          } catch (e: unknown) {
                            toast.error(e instanceof Error ? e.message : "Erro");
                          }
                        }}
                      >
                        Não aceitar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full sm:max-w-xs" />
        <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full sm:max-w-xs" />
        <Input
          placeholder="Senha (opcional)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full sm:max-w-xs"
          type="password"
        />
        <Input
          placeholder="Instituição"
          value={inst}
          onChange={(e) => setInst(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Button
          className="w-full sm:w-auto"
          onClick={async () => {
            try {
              const res = await actionCreateAvaliador({ nome, email, senha, instituicao: inst });
              if (res?.avisoCredenciais) {
                console.warn(res.avisoCredenciais);
                toast.warning(res.avisoCredenciais, { duration: 25000 });
              } else {
                toast.success("Avaliador criado");
              }
              window.location.reload();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
        >
          Adicionar
        </Button>
      </div>
      <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Importar CSV de avaliadores com cabeçalhos contendo <code>nome</code> e <code>email</code> (por exemplo:
          <code> 1. Nome Completo</code> e <code>2. E-mail</code> do Google Forms). O sistema gera senha aleatória e
          envia e-mail com as credenciais.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={baixarModeloCsv}>
            Baixar modelo CSV
          </Button>
          <Input
            type="file"
            accept=".csv,text/csv"
            className="max-w-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const content = await file.text();
              setCsvText(content);
              toast.success(`Arquivo carregado: ${file.name}`);
            }}
          />
        </div>
        <textarea
          className="min-h-28 w-full rounded-md border border-input bg-background p-2 text-sm"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"nome,email\nMaria,maria@email.com\nJoão,joao@email.com"}
        />
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={!csvText.trim()}
            onClick={async () => {
              try {
                const res = await actionImportarAvaliadoresCSV(csvText);
                if (res.erros.length) {
                  toast.warning(`Importação concluída com avisos. Inseridos: ${res.inseridos}.`);
                  console.warn(res.erros);
                } else {
                  toast.success(`Importação concluída. Inseridos: ${res.inseridos}.`);
                }
                window.location.reload();
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Erro");
              }
            }}
          >
            Importar CSV de avaliadores
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initial.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.nome}</TableCell>
              <TableCell>{a.email}</TableCell>
              <TableCell>{a.carga}</TableCell>
              <TableCell>
                <Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button size="sm" variant="outline" onClick={() => actionToggleAvaliador(a.id, !a.ativo).then(() => window.location.reload())}>
                  {a.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const nn = prompt("Nome", a.nome) ?? a.nome;
                    const ee = prompt("E-mail", a.email) ?? a.email;
                    await actionUpdateAvaliador(a.id, { nome: nn, email: ee, instituicao: a.instituicao ?? undefined });
                    window.location.reload();
                  }}
                >
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => actionDeleteAvaliador(a.id).then(() => window.location.reload())}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
