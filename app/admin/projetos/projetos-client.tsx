"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Projeto, ProjetoFase, ProjetoStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { actionDesclassificar, actionReclassificar } from "@/app/actions/admin";
import { toast } from "sonner";

function labelStatus(status: ProjetoStatus) {
  switch (status) {
    case "INSCRITO":
      return "Inscrito";
    case "DESCLASSIFICADO":
      return "Desclassificado";
    case "EM_AVALIACAO":
      return "Em Avaliação";
    case "AGUARDANDO_3O_AVALIADOR":
      return "Aguardando 3º avaliador";
    case "AVALIADO":
      return "Avaliado";
    case "SELECIONADO":
      return "Selecionado";
    case "SUPLENTE":
      return "Suplente";
    case "NAO_SELECIONADO":
      return "Não selecionado";
    default:
      return status;
  }
}

function labelFase(fase: ProjetoFase) {
  return fase === "IDEACAO" ? "Ideação" : "Validação";
}

export function ProjetosClient({ initial }: { initial: Projeto[] }) {
  const [municipio, setMunicipio] = useState("");
  const [fase, setFase] = useState<ProjetoFase | "">("");
  const [status, setStatus] = useState<ProjetoStatus | "">("");
  const [motivo, setMotivo] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash?.replace(/^#/, "") ?? "";
    if (!raw) return;
    setFocusId(raw);
    const el = document.getElementById(`projeto-row-${raw}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const municipiosDisponiveis = useMemo(() => {
    return Array.from(new Set(initial.map((p) => p.municipio).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [initial]);

  const filtrados = useMemo(() => {
    return initial.filter((p) => {
      if (municipio && p.municipio !== municipio) return false;
      if (fase && p.fase !== fase) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [initial, municipio, fase, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <select
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Município (todos)</option>
          {municipiosDisponiveis.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={fase}
          onChange={(e) => setFase(e.target.value as ProjetoFase | "")}
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Fase (todas)</option>
          <option value="IDEACAO">Ideação</option>
          <option value="VALIDACAO">Validação</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjetoStatus | "")}
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Status (todos)</option>
          <option value="INSCRITO">Inscrito</option>
          <option value="DESCLASSIFICADO">Desclassificado</option>
          <option value="EM_AVALIACAO">Em Avaliação</option>
          <option value="AGUARDANDO_3O_AVALIADOR">Aguardando 3º avaliador</option>
          <option value="AVALIADO">Avaliado</option>
          <option value="SELECIONADO">Selecionado</option>
          <option value="SUPLENTE">Suplente</option>
          <option value="NAO_SELECIONADO">Não selecionado</option>
        </select>
        <Button variant="outline" onClick={() => {
          setMunicipio("");
          setFase("");
          setStatus("");
        }}>
          Limpar filtros
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Município</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Dif. notas (1º×2º)</TableHead>
            <TableHead className="text-center">Precisa 3º?</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtrados.map((p) => (
            <TableRow
              key={p.id}
              id={`projeto-row-${p.id}`}
              className={focusId === p.id ? "bg-amber-500/10" : undefined}
            >
              <TableCell className="font-medium">{p.nome_projeto}</TableCell>
              <TableCell>{p.nome_responsavel}</TableCell>
              <TableCell>{p.municipio}</TableCell>
              <TableCell>{labelFase(p.fase)}</TableCell>
              <TableCell>
                <Badge variant="outline">{labelStatus(p.status)}</Badge>
                {p.is_sertao && (
                  <Badge className="ml-1" variant="secondary">
                    Sertão
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {typeof (p as Projeto & { diff_notas_para_3o?: number | null }).diff_notas_para_3o === "number"
                  ? (p as Projeto & { diff_notas_para_3o: number }).diff_notas_para_3o.toFixed(2)
                  : "—"}
              </TableCell>
              <TableCell className="text-center">
                {(p as Projeto & { precisa_3o_avaliador?: boolean | null }).precisa_3o_avaliador === true
                  ? "Sim"
                  : (p as Projeto & { precisa_3o_avaliador?: boolean | null }).precisa_3o_avaliador === false
                    ? "Não"
                    : "—"}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/projetos/${p.id}`}>Detalhes</Link>
                </Button>
                {p.status !== "DESCLASSIFICADO" ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Desclassificar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Motivo obrigatório</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>Motivo</Label>
                        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                        <Button
                          disabled={!motivo.trim()}
                          onClick={async () => {
                            await actionDesclassificar(p.id, motivo);
                            toast.success("Projeto desclassificado");
                            window.location.reload();
                          }}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await actionReclassificar(p.id);
                      toast.success("Reclassificado como inscrito");
                      window.location.reload();
                    }}
                  >
                    Reclassificar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
