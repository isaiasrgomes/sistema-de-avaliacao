"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Projeto, ProjetoFase, ProjetoStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { actionDesclassificar, actionReclassificar } from "@/app/actions/admin";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";

type ProjetoComAvaliadores = Projeto & { qtd_avaliadores_atual?: number | null };

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

type SearchableOption = {
  value: string;
  label: string;
  search: string;
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.search.includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Button type="button" variant="outline" className="h-10 w-full justify-between" onClick={() => setOpen((v) => !v)}>
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
                    <span className="truncate pr-2">{o.label}</span>
                    {o.value === value ? <Check className="h-4 w-4 text-primary" /> : null}
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

export function ProjetosClient({ initial }: { initial: ProjetoComAvaliadores[] }) {
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

  const municipioOptions = useMemo<SearchableOption[]>(
    () => municipiosDisponiveis.map((m) => ({ value: m, label: m, search: m.toLowerCase() })),
    [municipiosDisponiveis]
  );
  const faseOptions: SearchableOption[] = [
    { value: "IDEACAO", label: "Ideação", search: "ideacao ideação" },
    { value: "VALIDACAO", label: "Validação", search: "validacao validação" },
  ];
  const statusOptions: SearchableOption[] = [
    { value: "INSCRITO", label: "Inscrito", search: "inscrito" },
    { value: "DESCLASSIFICADO", label: "Desclassificado", search: "desclassificado" },
    { value: "EM_AVALIACAO", label: "Em Avaliação", search: "em avaliacao em avaliação" },
    { value: "AGUARDANDO_3O_AVALIADOR", label: "Aguardando 3º avaliador", search: "aguardando 3 avaliador" },
    { value: "AVALIADO", label: "Avaliado", search: "avaliado" },
    { value: "SELECIONADO", label: "Selecionado", search: "selecionado" },
    { value: "SUPLENTE", label: "Suplente", search: "suplente" },
    { value: "NAO_SELECIONADO", label: "Não selecionado", search: "nao selecionado não selecionado" },
  ];

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
      <div className="grid gap-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm md:grid-cols-3">
        <SearchableDropdown
          label="Município"
          value={municipio}
          onChange={setMunicipio}
          options={municipioOptions}
          placeholder="Município (todos)"
          emptyText="Nenhum município encontrado."
        />
        <SearchableDropdown
          label="Fase"
          value={fase}
          onChange={(v) => setFase(v as ProjetoFase | "")}
          options={faseOptions}
          placeholder="Fase (todas)"
          emptyText="Nenhuma fase encontrada."
        />
        <SearchableDropdown
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as ProjetoStatus | "")}
          options={statusOptions}
          placeholder="Status (todos)"
          emptyText="Nenhum status encontrado."
        />
        <Button variant="outline" onClick={() => {
          setMunicipio("");
          setFase("");
          setStatus("");
        }} className="md:col-span-3 md:w-fit">
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
            <TableHead className="text-center">Avaliadores</TableHead>
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
                {(p.qtd_avaliadores_atual ?? 0) > 0 && (p.qtd_avaliadores_atual ?? 0) < 2 ? (
                  <Badge className="border-red-500/35 bg-red-500/10 text-red-700 dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200">
                    Avaliação pendente
                  </Badge>
                ) : (p.qtd_avaliadores_atual ?? 0) === 0 ? (
                  <Badge variant="outline">Inscrito</Badge>
                ) : (
                  <Badge variant="outline">{labelStatus(p.status)}</Badge>
                )}
                {p.is_sertao && (
                  <Badge className="ml-1" variant="secondary">
                    Sertão
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {p.qtd_avaliadores_atual ?? 0}
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
