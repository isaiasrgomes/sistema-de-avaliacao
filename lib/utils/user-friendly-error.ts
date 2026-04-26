function normalizeText(value: string) {
  return value.replace(/^error:\s*/i, "").replace(/\s+/g, " ").trim();
}

function extractErrorReason(error: unknown): string {
  if (typeof error === "string") return normalizeText(error);
  if (error instanceof Error) return normalizeText(error.message || "");
  if (!error || typeof error !== "object") return "";

  const candidate = error as {
    message?: unknown;
    error_description?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };

  const pieces = [candidate.message, candidate.error_description, candidate.details, candidate.hint, candidate.code]
    .map((part) => (typeof part === "string" ? normalizeText(part) : ""))
    .filter(Boolean);

  return pieces.join(" - ").trim();
}

export function getUserFriendlyErrorMessage(error: unknown, fallback = "Não foi possível concluir a ação. Tente novamente.") {
  const raw = extractErrorReason(error);
  const msg = raw.toLowerCase();

  if (!msg) return fallback;

  if (msg.includes("password should be at least") || msg.includes("password should contain at least")) {
    return "Sua senha precisa ter no mínimo 8 caracteres, com letras maiúsculas, minúsculas e números.";
  }
  if (msg.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos. Confira seus dados e tente novamente.";
  }
  if (msg.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "Este e-mail já está cadastrado. Faça login ou recupere sua senha.";
  }
  if (msg.includes("invalid email")) {
    return "O e-mail informado parece inválido. Revise e tente novamente.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
  }
  if (msg.includes("jwt") || msg.includes("token") || msg.includes("expired")) {
    return "Seu link de acesso expirou. Solicite um novo link e tente novamente.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  }
  if (msg.includes("23505") || msg.includes("duplicate key")) {
    return "Já existe um registro com esses dados. Verifique e tente novamente.";
  }
  if (msg.includes("23503") || msg.includes("foreign key")) {
    return "Não foi possível concluir porque existem vínculos com outros registros.";
  }
  if (msg.includes("42501") || msg.includes("permission denied") || msg.includes("not allowed")) {
    return "Você não tem permissão para executar esta ação.";
  }
  if (msg.includes("22p02") || msg.includes("invalid input syntax")) {
    return "Há um dado em formato inválido. Revise os campos e tente novamente.";
  }

  const normalizedFallback = normalizeText(fallback);
  const reason = raw.charAt(0).toLowerCase() + raw.slice(1);
  return `${normalizedFallback} Motivo: ${reason}.`;
}
