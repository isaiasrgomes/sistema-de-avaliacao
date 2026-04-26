"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionRecalcularRanking, actionRegistrarRecurso } from "@/app/actions/admin";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

export default function RecursosPage() {
  const supabase = createClient();
  const [projetos, setProjetos] = useState<{ id: string; nome_projeto: string }[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [parecer, setParecer] = useState("");
  const [deferido, setDeferido] = useState(false);
  const [altera, setAltera] = useState(false);
  const [nota, setNota] = useState("");

  useEffect(() => {
    void supabase
      .from("projetos")
      .select("id, nome_projeto")
      .order("nome_projeto")
      .then(({ data }) => setProjetos(data ?? []));
  }, [supabase]);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recursos</h1>
        <p className="text-sm text-muted-foreground">Registre recurso, parecer e eventual ajuste de nota (com auditoria).</p>
      </div>
      <div className="space-y-2 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <Label>Projeto</Label>
        <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
          <option value="">—</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome_projeto}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Descrição do recurso</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Parecer do coordenador</Label>
        <Textarea value={parecer} onChange={(e) => setParecer(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={deferido} onChange={(e) => setDeferido(e.target.checked)} />
        Deferido
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={altera} onChange={(e) => setAltera(e.target.checked)} />
        Alterar nota manualmente
      </label>
      {altera && (
        <div className="space-y-2">
          <Label>Nota ajustada</Label>
          <Input value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
      )}
      <Button
        onClick={async () => {
          try {
            await actionRegistrarRecurso(
              projetoId,
              descricao,
              parecer || null,
              deferido,
              altera,
              altera ? Number(nota) : null
            );
            toast.success("Recurso registrado");
          } catch (e: unknown) {
            toast.error(getUserFriendlyErrorMessage(e, "Não foi possível registrar o recurso."));
          }
        }}
      >
        Salvar recurso
      </Button>
      <Button
        variant="secondary"
        onClick={async () => {
          await actionRecalcularRanking();
          toast.success("Ranking recalculado");
          window.location.reload();
        }}
      >
        Recalcular ranking
      </Button>
    </div>
  );
}
