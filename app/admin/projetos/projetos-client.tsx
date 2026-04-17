"use client";

import { useMemo, useState } from "react";
import type { Projeto, ProjetoFase, ProjetoStatus } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [setor, setSetor] = useState("");
  const [status, setStatus] = useState<ProjetoStatus | "">("");
  const [motivo, setMotivo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return initial.filter((p) => {
      if (municipio && !p.municipio.toLowerCase().includes(municipio.toLowerCase())) return false;
      if (fase && p.fase !== fase) return false;
      if (setor && !p.categoria_setor.toLowerCase().includes(setor.toLowerCase())) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [initial, municipio, fase, setor, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <Input placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="max-w-xs" />
        <Input placeholder="Fase (IDEACAO/VALIDACAO)" value={fase} onChange={(e) => setFase(e.target.value as ProjetoFase)} className="max-w-xs" />
        <Input placeholder="Setor" value={setor} onChange={(e) => setSetor(e.target.value)} className="max-w-xs" />
        <Input placeholder="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjetoStatus)} className="max-w-xs" />
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
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtrados.map((p) => (
            <TableRow key={p.id}>
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
              <TableCell className="text-right space-x-2">
                <Dialog open={openId === p.id} onOpenChange={(o) => setOpenId(o ? p.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{p.nome_projeto}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Responsável:</strong> {p.nome_responsavel} — {p.email_responsavel}
                      </p>
                      <p>
                        <strong>CPF:</strong> {p.cpf_responsavel}
                      </p>
                      <p>
                        <strong>Vídeo:</strong>{" "}
                        {p.url_video_pitch ? (
                          <a href={p.url_video_pitch} className="text-primary underline" target="_blank" rel="noreferrer">
                            abrir link
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
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
