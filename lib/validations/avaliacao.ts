import { z } from "zod";

export const avaliacaoSchema = z.object({
  nota_equipe: z.number().int().min(1).max(5),
  nota_mercado: z.number().int().min(1).max(5),
  nota_produto: z.number().int().min(1).max(5),
  nota_tecnologia: z.number().int().min(1).max(5),
  justificativa_geral: z.string().min(10, "Justificativa mínima de 10 caracteres"),
  observacoes_gerais: z.string().optional(),
});

export type AvaliacaoForm = z.infer<typeof avaliacaoSchema>;
