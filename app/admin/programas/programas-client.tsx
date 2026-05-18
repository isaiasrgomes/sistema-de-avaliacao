"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionCriarPrograma, actionSelecionarProgramaMonitor } from "@/app/actions/programas";
import { labelTipoPrograma, type Programa } from "@/lib/programa/types";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

export function ProgramasClient({ programas }: { programas: Programa[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<"INCUBACAO" | "PRE_INCUBACAO">("PRE_INCUBACAO");
  const [nome, setNome] = useState("");
  const [edital, setEdital] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [avInicio, setAvInicio] = useState("");
  const [avFim, setAvFim] = useState("");

  async function selecionar(id: string) {
    try {
      await actionSelecionarProgramaMonitor(id);
      router.push("/admin");
      router.refresh();
    } catch (e: unknown) {
      toast.error(getUserFriendlyErrorMessage(e, "Não foi possível selecionar o programa."));
    }
  }

  return (
  <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Selecione o programa para monitorar</h1>
        <p className="text-sm text-muted-foreground">
          Programas finalizados abrem em modo somente leitura. Nenhum dado é apagado ao criar uma nova edição.
        </p>
      </div>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar programa
      </Button>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {programas.map((p) => (
        <Card key={p.id} className="border-border/70 bg-card/85">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{p.nome}</CardTitle>
              <Badge variant={p.status === "FINALIZADO" ? "secondary" : "default"}>
                {p.status === "FINALIZADO" ? "🟢 Finalizado" : "🟡 Em processo"}
              </Badge>
            </div>
            <CardDescription>
              {labelTipoPrograma(p.tipo)} · {p.edital}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              Programa: {fmtDate(p.data_inicio)} — {fmtDate(p.data_fim)}
            </p>
            <p>
              Avaliações: {fmtDate(p.avaliacoes_inicio)} — {fmtDate(p.avaliacoes_fim)}
            </p>
            {p.data_finalizacao ? <p>Finalizado em: {fmtDate(p.data_finalizacao)}</p> : null}
            <Button type="button" className="w-full" variant="outline" onClick={() => selecionar(p.id)}>
              {p.status === "FINALIZADO" ? "Visualizar (somente leitura)" : "Monitorar programa"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>

    {programas.length === 0 ? (
      <p className="mt-8 text-center text-sm text-muted-foreground">Nenhum programa cadastrado. Crie o primeiro acima.</p>
    ) : null}

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo programa</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const r = await actionCriarPrograma({
                tipo,
                nome,
                edital,
                data_inicio: dataInicio,
                data_fim: dataFim,
                avaliacoes_inicio: avInicio,
                avaliacoes_fim: avFim,
              });
              toast.success("Programa criado.");
              setOpen(false);
              await actionSelecionarProgramaMonitor(r.id);
              router.push("/admin");
              router.refresh();
            } catch (err: unknown) {
              toast.error(getUserFriendlyErrorMessage(err, "Não foi possível criar o programa."));
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label>Tipo do programa</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "INCUBACAO" | "PRE_INCUBACAO")}
            >
              <option value="PRE_INCUBACAO">Pré-Incubação</option>
              <option value="INCUBACAO">Incubação</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Nome do programa</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Edital</Label>
            <Input value={edital} onChange={(e) => setEdital(e.target.value)} placeholder="Edital nº 45/2026" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data início do programa</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data final do programa</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Início das avaliações</Label>
              <Input type="datetime-local" value={avInicio} onChange={(e) => setAvInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fim das avaliações</Label>
              <Input type="datetime-local" value={avFim} onChange={(e) => setAvFim(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando…" : "Criar programa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}
