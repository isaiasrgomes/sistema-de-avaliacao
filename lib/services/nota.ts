/** Nota ponderada (20–100) conforme edital */
export function calcularNotaPonderada(
  nota_equipe: number,
  nota_mercado: number,
  nota_produto: number,
  nota_tecnologia: number
) {
  return nota_equipe * 6 + nota_mercado * 6 + nota_produto * 4 + nota_tecnologia * 4;
}

/**
 * CV entre duas notas totais: cv = (|A-B| / média) * 100, média = (A+B)/2
 */
export function coeficienteVariacaoDoisValores(a: number, b: number): number {
  const media = (a + b) / 2;
  if (media === 0) return 0;
  return (Math.abs(a - b) / media) * 100;
}
