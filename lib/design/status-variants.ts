/** Variantes visuais padronizadas para badges de status em todo o sistema. */
export type StatusVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral" | "muted";

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  INSCRITO: "info",
  DESCLASSIFICADO: "danger",
  EM_AVALIACAO: "warning",
  EM_ANDAMENTO: "warning",
  AGUARDANDO_3O_AVALIADOR: "warning",
  AGUARDANDO: "warning",
  PENDENTE: "warning",
  AVALIADO: "success",
  CONCLUIDA: "success",
  CONCLUIDO: "success",
  FINALIZADO: "success",
  EM_PROCESSO: "warning",
  SELECIONADO: "success",
  SUPLENTE: "info",
  NAO_SELECIONADO: "neutral",
  ATIVO: "success",
  INATIVO: "muted",
  APROVADO: "success",
  RECUSADO: "danger",
};

function normalizeStatusKey(status?: string | null) {
  if (!status) return "";
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function getStatusVariant(status?: string | null): StatusVariant {
  const key = normalizeStatusKey(status);
  return STATUS_VARIANT_MAP[key] ?? "neutral";
}

export const statusBadgeClassNames: Record<StatusVariant, string> = {
  default: "border-primary/25 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  danger: "border-destructive/35 bg-destructive/10 text-destructive",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200",
  neutral: "border-border bg-muted/60 text-foreground/80",
  muted: "border-border/80 bg-muted/40 text-muted-foreground",
};
