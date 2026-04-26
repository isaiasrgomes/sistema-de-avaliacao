"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  actionAtribuicaoAuto,
  actionAtribuicaoManual,
  actionAtribuirTerceiro,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { getStatusLabel } from "@/lib/utils/status";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

function statusBadgeClass(status: string) {
  switch (status) {
    case "INSCRITO":
      return "border-slate-500/35 bg-slate-500/10 text-slate-700 dark:border-slate-300/35 dark:bg-slate-200/10 dark:text-slate-200";
    case "EM_AVALIACAO":
      return "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200";
    case "AGUARDANDO_3O_AVALIADOR":
      return "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:border-orange-300/40 dark:bg-orange-300/15 dark:text-orange-200";
    case "AVALIADO":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-200";
    default:
      return "border-muted-foreground/30 bg-muted/40 text-foreground dark:border-muted-foreground/40 dark:bg-muted/30 dark:text-foreground";
  }
}

type SearchableOption = {
  value: string;
  label: string;
  search: string;
  status?: string;
};

function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyText,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.search.includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div ref={wrapperRef} className="relative">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate text-left">{selected?.label ?? placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
        {open ? (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-border/70 bg-popover p-2 shadow-lg">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="mb-2 h-9"
              autoFocus
            />
            <div className="max-h-56 overflow-auto rounded-md border border-border/60">
              {filtered.length ? (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 border-b border-border/40 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate pr-2 font-medium">{o.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.status ? (
                        <Badge variant="outline" className={`max-w-[11rem] whitespace-nowrap ${statusBadgeClass(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </Badge>
                      ) : null}
                      {o.value === value ? <Check className="h-4 w-4 text-primary" /> : null}
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AtribuicoesClient({
  projetos,
  avaliadores,
  nAvaliadores,
}: {
  projetos: { id: string; nome_projeto: string; status: string }[];
  avaliadores: { id: string; nome: string; email: string }[];
  nAvaliadores: number;
}) {
  const [projetoId, setProjetoId] = useState("");
  const [manualIds, setManualIds] = useState<string[]>(() => Array(Math.max(1, nAvaliadores)).fill(""));
  const [projetoTerceiro, setProjetoTerceiro] = useState("");
  const [a3, setA3] = useState("");
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isTerceiroLoading, setIsTerceiroLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const projetoOptions = useMemo<SearchableOption[]>(
    () =>
      projetos.map((p) => ({
        value: p.id,
        label: p.nome_projeto,
        search: `${p.nome_projeto} ${p.status}`.toLowerCase(),
        status: p.status,
      })),
    [projetos]
  );

  const projetoTerceiroOptions = useMemo<SearchableOption[]>(
    () =>
      projetos.map((p) => ({
        value: p.id,
        label: p.nome_projeto,
        search: `${p.nome_projeto} ${p.status}`.toLowerCase(),
        status: p.status,
      })),
    [projetos]
  );

  const avaliadorOptions = useMemo<SearchableOption[]>(
    () =>
      avaliadores.map((a) => ({
        value: a.id,
        label: `${a.nome} (${a.email})`,
        search: `${a.nome} ${a.email}`.toLowerCase(),
      })),
    [avaliadores]
  );

  useEffect(() => {
    setManualIds((prev) => {
      const n = Math.max(1, nAvaliadores);
      if (prev.length === n) return prev;
      return Array(n).fill("");
    });
  }, [nAvaliadores]);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Manual</h2>
          <SearchableDropdown
            label="Projeto"
            value={projetoId}
            onChange={setProjetoId}
            options={projetoOptions}
            placeholder="Selecione..."
            emptyText="Nenhum projeto encontrado."
          />
          {Array.from({ length: Math.max(1, nAvaliadores) }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SearchableDropdown
                label={`Avaliador ${i + 1} de ${nAvaliadores}`}
                value={manualIds[i] ?? ""}
                onChange={(v) => {
                  setManualIds((prev) => {
                    const next = [...prev];
                    next[i] = v;
                    return next;
                  });
                }}
                options={avaliadorOptions}
                placeholder="Selecione avaliador..."
                emptyText="Nenhum avaliador encontrado."
              />
            </div>
          ))}
          <Button
            disabled={!projetoId || manualIds.some((x) => !x) || new Set(manualIds).size !== manualIds.length || isManualLoading}
            onClick={async () => {
              try {
                setIsManualLoading(true);
                await actionAtribuicaoManual(projetoId, manualIds);
                toast.success("Atribuições salvas");
                window.location.reload();
              } catch (e: unknown) {
                toast.error(getUserFriendlyErrorMessage(e, "Não foi possível salvar as atribuições."));
              } finally {
                setIsManualLoading(false);
              }
            }}
          >
            {isManualLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isManualLoading ? "Processando..." : "Salvar manual"}
          </Button>
        </div>
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Adicionar avaliador ao projeto</h2>
          <p className="text-sm text-muted-foreground">
            Adiciona um novo avaliador sem substituir os atuais (próxima ordem livre), inclusive quando alguém não puder
            concluir no prazo.
          </p>
          <SearchableDropdown
            label="Projeto"
            value={projetoTerceiro}
            onChange={setProjetoTerceiro}
            options={projetoTerceiroOptions}
            placeholder="Selecione projeto..."
            emptyText="Nenhum projeto elegível encontrado."
          />
          <SearchableDropdown
            label="Avaliador"
            value={a3}
            onChange={setA3}
            options={avaliadorOptions}
            placeholder="Selecione avaliador..."
            emptyText="Nenhum avaliador encontrado."
          />
          <Button
            variant="secondary"
            disabled={!projetoTerceiro || !a3 || isTerceiroLoading}
            onClick={async () => {
              try {
                setIsTerceiroLoading(true);
                await actionAtribuirTerceiro(projetoTerceiro, a3);
                toast.success("Avaliador atribuído");
                window.location.reload();
              } catch (e: unknown) {
                toast.error(getUserFriendlyErrorMessage(e, "Não foi possível adicionar o avaliador."));
              } finally {
                setIsTerceiroLoading(false);
              }
            }}
          >
            {isTerceiroLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTerceiroLoading ? "Processando..." : "Adicionar avaliador"}
          </Button>
        </div>
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Automático</h2>
          <p className="text-sm text-muted-foreground">
            Distribui {nAvaliadores} avaliador(es) por projeto sem atribuição prévia, equilibrando carga e respeitando
            impedimentos.
          </p>
          <Button
            disabled={isAutoLoading}
            onClick={async () => {
              const ids = projetos.map((p) => p.id);
              try {
                setIsAutoLoading(true);
                const r = await actionAtribuicaoAuto(ids);
                toast.success(`Atribuições criadas: ${r.criadas ?? 0}`);
              } catch (e: unknown) {
                toast.error(getUserFriendlyErrorMessage(e, "Não foi possível executar a atribuição automática."));
              } finally {
                setIsAutoLoading(false);
              }
            }}
          >
            {isAutoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAutoLoading ? "Processando..." : "Rodar automático (todos elegíveis)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
