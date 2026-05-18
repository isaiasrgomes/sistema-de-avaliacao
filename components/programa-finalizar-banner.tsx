"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actionFinalizarPrograma } from "@/app/actions/programas";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

export function ProgramaFinalizarBanner({ prazoEncerrado }: { prazoEncerrado: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!prazoEncerrado) return null;

  return (
    <>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Prazo de avaliação encerrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O prazo de avaliação foi encerrado. Finalize o processo para gerar o resultado final e arquivar este
                programa no histórico.
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => setOpen(true)} className="shrink-0">
            Finalizar processo de avaliação
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar finalização</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Tem certeza que deseja finalizar o processo de avaliação?</p>
            <p>
              Após finalizar, não será mais possível alterar notas, critérios ou rankings deste programa. O resultado
              será salvo permanentemente no histórico público.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await actionFinalizarPrograma();
                  toast.success("Programa finalizado. Resultado salvo no histórico.");
                  setOpen(false);
                  window.location.reload();
                } catch (e: unknown) {
                  toast.error(getUserFriendlyErrorMessage(e, "Não foi possível finalizar o programa."));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Finalizando…" : "Confirmar finalização"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
