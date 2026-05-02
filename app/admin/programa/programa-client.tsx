"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionLembreteAvaliadoresPendentes, actionProrrogarPrazo, actionSalvarPrograma } from "@/app/actions/admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatPtBrDateTime(value: string | null): string {
  if (!value) return "Não definido";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Não definido";
  return d.toLocaleString("pt-BR");
}

export function ProgramaClient({
  initial,
}: {
  initial: {
    programa_nome: string | null;
    avaliacoes_inicio: string | null;
    avaliacoes_fim: string | null;
    prorrogacao_fim: string | null;
    prorrogacao_utilizada: boolean;
    avaliadores_por_projeto: number;
  };
}) {
  const [nome, setNome] = useState(initial.programa_nome ?? "");
  const [ini, setIni] = useState(toLocalInput(initial.avaliacoes_inicio));
  const [fim, setFim] = useState(toLocalInput(initial.avaliacoes_fim));
  const [nAv, setNAv] = useState(String(initial.avaliadores_por_projeto));
  const [prorro, setProrro] = useState(toLocalInput(initial.prorrogacao_fim));
  const [utilizada, setUtilizada] = useState(initial.prorrogacao_utilizada);
  const [loading, setLoading] = useState<"save" | "prorro" | "email" | null>(null);

  const fimVigenteIso = initial.prorrogacao_fim ?? initial.avaliacoes_fim;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Dados gerais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome do programa / edital</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: SerTão Inovador — Edital 45/2026" />
          </div>
          <div className="space-y-2">
            <Label>Início das avaliações</Label>
            <Input type="datetime-local" value={ini} onChange={(e) => setIni(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fim das avaliações (prazo original)</Label>
            <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Avaliadores por proposta</Label>
            <Input
              type="number"
              min={1}
              max={15}
              value={nAv}
              onChange={(e) => setNAv(e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Usado na distribuição automática e no modo manual.</p>
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={loading !== null}
          onClick={async () => {
            try {
              setLoading("save");
              await actionSalvarPrograma({
                programa_nome: nome || null,
                avaliacoes_inicio: fromLocalInput(ini),
                avaliacoes_fim: fromLocalInput(fim),
                avaliadores_por_projeto: Number(nAv) || 2,
              });
              toast.success("Programa salvo");
              window.location.reload();
            } catch (e: unknown) {
              toast.error(getUserFriendlyErrorMessage(e, "Não foi possível salvar as configurações do programa."));
            } finally {
              setLoading(null);
            }
          }}
        >
          {loading === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <h2 className="mb-1 font-semibold">Prorrogação do prazo (uma vez)</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Define uma nova data/hora final. Após confirmar, não será possível alterar de novo.
        </p>
        <p className="mb-2 text-sm text-muted-foreground">
          Prazo final vigente: <strong>{formatPtBrDateTime(fimVigenteIso)}</strong>
        </p>
        {utilizada ? (
          <p className="text-sm text-muted-foreground">
            Prorrogação já aplicada. Data registrada:{" "}
              {formatPtBrDateTime(initial.prorrogacao_fim)}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Nova data/hora final (após prorrogação)</Label>
              <Input type="datetime-local" value={prorro} onChange={(e) => setProrro(e.target.value)} />
            </div>
            <Button
              variant="secondary"
              className="mt-3"
              disabled={loading !== null || !prorro.trim()}
              onClick={async () => {
                try {
                  setLoading("prorro");
                  const iso = fromLocalInput(prorro);
                  if (!iso) {
                    toast.error("Informe uma data válida.");
                    return;
                  }
                  await actionProrrogarPrazo(iso);
                  toast.success("Prorrogação registrada");
                  setUtilizada(true);
                  window.location.reload();
                } catch (e: unknown) {
                  toast.error(getUserFriendlyErrorMessage(e, "Não foi possível registrar a prorrogação."));
                } finally {
                  setLoading(null);
                }
              }}
            >
              {loading === "prorro" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar prorrogação única
            </Button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <h2 className="mb-1 font-semibold">Lembretes por e-mail</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Envia um lembrete para cada avaliador que ainda tem atribuição pendente (ou em andamento). Configure{" "}
          <code className="text-xs">RESEND_API_KEY</code> e <code className="text-xs">EMAIL_FROM</code> no servidor.
        </p>
        <Button
          variant="outline"
          disabled={loading !== null}
          onClick={async () => {
            try {
              setLoading("email");
              const r = await actionLembreteAvaliadoresPendentes();
              if (r.erro) {
                toast.error(r.erro);
              } else {
                toast.success(`E-mails enviados: ${r.enviados} de ${r.total}`);
              }
              if (r.aviso) toast.message(r.aviso);
            } catch (e: unknown) {
              toast.error(getUserFriendlyErrorMessage(e, "Não foi possível enviar os lembretes."));
            } finally {
              setLoading(null);
            }
          }}
        >
          {loading === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lembrar avaliadores pendentes
        </Button>
      </div>
    </div>
  );
}
