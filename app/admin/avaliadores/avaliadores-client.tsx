"use client";

import { useState } from "react";
import type { Avaliador } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actionCreateAvaliador, actionDeleteAvaliador, actionToggleAvaliador, actionUpdateAvaliador } from "@/app/actions/avaliadores-crud";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Row = Avaliador & { carga: number };

export function AvaliadoresClient({ initial }: { initial: Row[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [inst, setInst] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
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
  );
}
