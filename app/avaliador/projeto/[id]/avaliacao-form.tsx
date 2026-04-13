"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { avaliacaoSchema, type AvaliacaoForm } from "@/lib/validations/avaliacao";
import { calcularNotaPonderada } from "@/lib/services/nota";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionDeclararImpedimento, actionEnviarAvaliacao } from "@/app/actions/avaliador";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AvaliacaoForm({
  projetoId,
  atribuicaoId,
  readOnly,
  initial,
}: {
  projetoId: string;
  atribuicaoId: string;
  readOnly: boolean;
  initial?: Record<string, unknown>;
}) {
  const form = useForm<AvaliacaoForm>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      nota_equipe: (initial?.nota_equipe as number) ?? 3,
      nota_mercado: (initial?.nota_mercado as number) ?? 3,
      nota_produto: (initial?.nota_produto as number) ?? 3,
      nota_tecnologia: (initial?.nota_tecnologia as number) ?? 3,
      justificativa_geral: (initial?.justificativa_geral as string) ?? "",
      observacoes_gerais: (initial?.observacoes_gerais as string) ?? "",
    },
  });

  const vals = form.watch();
  const total = useMemo(
    () =>
      calcularNotaPonderada(vals.nota_equipe ?? 0, vals.nota_mercado ?? 0, vals.nota_produto ?? 0, vals.nota_tecnologia ?? 0),
    [vals.nota_equipe, vals.nota_mercado, vals.nota_produto, vals.nota_tecnologia]
  );

  const [impOpen, setImpOpen] = useState(false);
  const [impTipo, setImpTipo] = useState<"SOCIETARIO" | "PROFISSIONAL" | "PARENTESCO" | "OUTRO">("OUTRO");

  if (!atribuicaoId) return <p className="text-destructive">Abra o projeto pela lista (link com atribuição).</p>;

  if (readOnly) {
    return (
      <div className="space-y-2 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Avaliação enviada (somente leitura)</p>
        <p>Nota ponderada: {Number(initial?.nota_total_ponderada ?? total).toFixed(2)}</p>
        <pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(initial, null, 2)}</pre>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-4"
      onSubmit={form.handleSubmit(async (data) => {
        try {
          await actionEnviarAvaliacao({
            projetoId,
            atribuicaoId,
            ...data,
            observacoes_gerais: data.observacoes_gerais ?? "",
          });
          toast.success("Avaliação enviada");
          window.location.href = "/avaliador";
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Erro");
        }
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(["nota_equipe", "nota_mercado", "nota_produto", "nota_tecnologia"] as const).map((f) => (
          <div key={f} className="space-y-2">
            <Label>{f.replace("nota_", "Nota ")}</Label>
            <Input type="number" min={1} max={5} {...form.register(f, { valueAsNumber: true })} />
            {form.formState.errors[f] && (
              <p className="text-xs text-destructive">{form.formState.errors[f]?.message as string}</p>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-md bg-muted p-3 text-sm">
        Nota total ponderada (tempo real): <strong>{total.toFixed(2)}</strong> (20–100)
      </div>
      <div className="space-y-2">
        <Label>Justificativa geral</Label>
        <Textarea rows={4} {...form.register("justificativa_geral")} />
        {form.formState.errors.justificativa_geral && (
          <p className="text-xs text-destructive">{form.formState.errors.justificativa_geral.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Observações gerais</Label>
        <Textarea rows={3} {...form.register("observacoes_gerais")} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Enviar avaliação</Button>
        <Dialog open={impOpen} onOpenChange={setImpOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive">
              Declarar impedimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tipo de impedimento</DialogTitle>
            </DialogHeader>
            <select
              className="flex h-10 w-full rounded-md border px-3 text-sm"
              value={impTipo}
              onChange={(e) => setImpTipo(e.target.value as typeof impTipo)}
            >
              <option value="SOCIETARIO">Societário</option>
              <option value="PROFISSIONAL">Profissional</option>
              <option value="PARENTESCO">Parentesco</option>
              <option value="OUTRO">Outro</option>
            </select>
            <Button
              onClick={async () => {
                await actionDeclararImpedimento(projetoId, atribuicaoId, impTipo);
                toast.success("Impedimento registrado");
                window.location.href = "/avaliador";
              }}
            >
              Confirmar
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
