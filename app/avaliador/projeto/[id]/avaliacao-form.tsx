"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { avaliacaoSchema, type AvaliacaoForm } from "@/lib/validations/avaliacao";
import { calcularNotaPonderada } from "@/lib/services/nota";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionDeclararImpedimento, actionEnviarAvaliacao } from "@/app/actions/avaliador";
import { toast } from "sonner";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const campoLabel: Record<string, string> = {
  nota_equipe: "Nota - Equipe",
  nota_mercado: "Nota - Mercado",
  nota_produto: "Nota - Produto",
  nota_tecnologia: "Nota - Tecnologia",
  nota_total_ponderada: "Nota total ponderada",
  justificativa_geral: "Justificativa geral",
  observacoes_gerais: "Observações gerais",
  created_at: "Enviada em",
  updated_at: "Atualizada em",
};

function formatarValor(chave: string, valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "Não informado";
  if (chave.includes("nota")) return Number(valor).toFixed(2);
  if (chave.includes("at") || chave.includes("data")) {
    const dt = new Date(String(valor));
    if (!Number.isNaN(dt.getTime())) return dt.toLocaleString("pt-BR");
  }
  if (typeof valor === "object") return "Informação disponível";
  return String(valor);
}

function StarRating({
  value,
  onChange,
  disabled,
  name,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  disabled?: boolean;
  name: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as const).map((n) => {
        const active = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${name}: ${n} de 5`}
            onClick={() => onChange(n)}
            className="rounded p-1 disabled:cursor-not-allowed"
          >
            <Star className={active ? "h-6 w-6 fill-amber-400 text-amber-500" : "h-6 w-6 text-muted-foreground"} />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground">{value ? `${value}/5` : "Selecione"}</span>
    </div>
  );
}

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
      nota_equipe: (initial?.nota_equipe as number) ?? (undefined as unknown as number),
      nota_mercado: (initial?.nota_mercado as number) ?? (undefined as unknown as number),
      nota_produto: (initial?.nota_produto as number) ?? (undefined as unknown as number),
      nota_tecnologia: (initial?.nota_tecnologia as number) ?? (undefined as unknown as number),
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

  const router = useRouter();
  const [impOpen, setImpOpen] = useState(false);
  const [impTipo, setImpTipo] = useState<"SOCIETARIO" | "PROFISSIONAL" | "PARENTESCO" | "OUTRO">("OUTRO");

  if (!atribuicaoId) return <p className="text-destructive">Abra o projeto pela lista (link com atribuição).</p>;

  if (readOnly) {
    const itens = Object.entries(initial ?? {}).filter(([k]) =>
      ["nota_equipe", "nota_mercado", "nota_produto", "nota_tecnologia", "justificativa_geral", "observacoes_gerais", "created_at", "updated_at"].includes(k)
    );

    return (
      <div className="space-y-4 rounded-xl border border-border/80 bg-card p-5 text-sm shadow-sm">
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="font-semibold text-primary">Avaliação enviada (somente leitura)</p>
          <p className="text-foreground">
            Nota ponderada final: <strong>{Number(initial?.nota_total_ponderada ?? total).toFixed(2)}</strong>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {itens.map(([campo, valor]) => (
            <div key={campo} className="rounded-lg border border-border/70 bg-muted/35 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {campoLabel[campo] ?? campo.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm text-foreground">{formatarValor(campo, valor)}</p>
            </div>
          ))}
        </div>
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
          router.push("/avaliador");
          router.refresh();
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Erro");
        }
      })}
    >
      <div className="space-y-4">
        {(
          [
            { key: "nota_equipe", label: "Equipe" },
            { key: "nota_mercado", label: "Mercado" },
            { key: "nota_produto", label: "Produto" },
            { key: "nota_tecnologia", label: "Tecnologia" },
          ] as const
        ).map(({ key, label }) => {
          const v = form.watch(key);
          return (
            <div key={key} className="space-y-2">
              <Label>{`Nota - ${label}`}</Label>
              <StarRating
                name={label}
                value={typeof v === "number" ? v : undefined}
                onChange={(n) => form.setValue(key, n as any, { shouldValidate: true, shouldDirty: true })}
              />
              {form.formState.errors[key] && (
                <p className="text-xs text-destructive">{form.formState.errors[key]?.message as string}</p>
              )}
            </div>
          );
        })}
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
                router.push("/avaliador");
                router.refresh();
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
