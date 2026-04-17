/** Rota após sessão válida (login ou callback). */
export function destinoAposLogin(
  role: string | null | undefined,
  cadastroAprovado: boolean | null | undefined,
  next: string
): string {
  if (role === "COORDENADOR") return "/admin";
  if (cadastroAprovado === true) {
    const n = next.startsWith("/") ? next : "/avaliador";
    return n;
  }
  return "/aguardando-aprovacao";
}
