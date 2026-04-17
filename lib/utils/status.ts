const STATUS_LABELS: Record<string, string> = {
  INSCRITO: "Inscrito",
  DESCLASSIFICADO: "Desclassificado",
  EM_AVALIACAO: "Em Avaliação",
  AGUARDANDO_3O_AVALIADOR: "Aguardando 3º avaliador",
  AVALIADO: "Avaliado",
  SELECIONADO: "Selecionado",
  SUPLENTE: "Suplente",
  NAO_SELECIONADO: "Não selecionado",
  PENDENTE: "Pendente",
  CONCLUIDA: "Concluída",
  CONCLUIDO: "Concluído",
};

function normalizeStatus(status?: string | null) {
  if (!status) return "";

  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function getStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);
  return STATUS_LABELS[normalized] ?? status ?? "—";
}
