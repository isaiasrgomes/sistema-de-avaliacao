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
  actionRejeitarCadastroAvaliador,
  actionToggleAvaliador,
  actionUpdateAvaliador,
} from "@/app/actions/avaliadores-crud";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Row = Avaliador & { carga: number };

type Pendente = { id: string; nome: string; email: string | null; criado_em: string };

export function AvaliadoresClient({ initial, cadastrosPendentes }: { initial: Row[]; cadastrosPendentes: Pendente[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [inst, setInst] = useState("");

  return (
    <div className="space-y-6">
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
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="max-w-xs" />
        <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-xs" />
        <Input placeholder="Instituição" value={inst} onChange={(e) => setInst(e.target.value)} className="max-w-xs" />
        <Button
          onClick={async () => {
            try {
              await actionCreateAvaliador({ nome, email, instituicao: inst });
              toast.success("Avaliador criado");
              window.location.reload();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
        >
          Adicionar
        </Button>
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
