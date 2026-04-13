import { z } from "zod";

export const projetoManualSchema = z.object({
  nome_projeto: z.string().min(1, "Obrigatório").max(255),
  nome_responsavel: z.string().min(1, "Obrigatório").max(255),
  email_responsavel: z.string().email("E-mail inválido").max(255),
  telefone: z.string().max(20).optional(),
  cpf_responsavel: z.string().min(11, "CPF inválido").max(14),
  cnpj: z.string().max(18).optional(),
  municipio: z.string().min(1, "Obrigatório").max(100),
  uf: z.literal("PE"),
  fase: z.enum(["IDEACAO", "VALIDACAO"]),
  categoria_setor: z.string().min(1, "Obrigatório").max(100),
  url_video_pitch: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Informe uma URL completa (http/https) ou deixe em branco"),
  timestamp_submissao: z.string().min(1, "Data obrigatória"),
});

export type ProjetoManualInput = z.infer<typeof projetoManualSchema>;
