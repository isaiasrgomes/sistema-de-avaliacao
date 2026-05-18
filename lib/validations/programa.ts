import { z } from "zod";

export const criarProgramaSchema = z.object({
  tipo: z.enum(["INCUBACAO", "PRE_INCUBACAO"]),
  nome: z.string().min(3, "Informe o nome do programa"),
  edital: z.string().min(3, "Informe o edital"),
  data_inicio: z.string().min(1, "Informe a data de início"),
  data_fim: z.string().min(1, "Informe a data final"),
  avaliacoes_inicio: z.string().min(1, "Informe o início das avaliações"),
  avaliacoes_fim: z.string().min(1, "Informe o fim das avaliações"),
});

export type CriarProgramaInput = z.infer<typeof criarProgramaSchema>;
