/** Rota após sessão válida (login ou callback). */
export function destinoAposLogin(
  role: string | null | undefined,
  cadastroAprovado: boolean | null | undefined,
  next: string,
  cadastroRecusado?: boolean | null | undefined
): string {
  const pathOnly = (next.trim().startsWith("/") ? next.trim() : `/${next.trim()}`).split("?")[0];
  if (pathOnly === "/redefinir-senha" || pathOnly.startsWith("/redefinir-senha/")) {
    return pathOnly;
  }

  if (role === "COORDENADOR") {
    const n = next.startsWith("/") ? next : "/admin";
    if (n.startsWith("/avaliador") || n.startsWith("/redefinir-senha")) return n;
    return "/admin";
  }
  if (cadastroRecusado === true) return "/cadastro-recusado";
  if (cadastroAprovado === true) {
    const n = next.startsWith("/") ? next : "/avaliador";
    return n;
  }
  return "/aguardando-aprovacao";
}
