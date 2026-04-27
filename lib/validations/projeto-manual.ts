import { z } from "zod";
import { validarCPF } from "@/lib/utils/documentos";
import { UFS_BRASIL } from "@/lib/constants/brasil";
import {
  CONVERSA_CLIENTES_OPTIONS,
  MATURIDADE_PROJETO_OPTIONS,
  RESPOSTA_ENCONTROS_OPTIONS,
  SETOR_APLICACAO_OPTIONS,
  TEMPO_DEDICACAO_OPTIONS,
} from "@/lib/constants/projeto-inscricao";

export const projetoManualSchema = z.object({
  nome_projeto: z.string().min(1, "Obrigatório").max(255),
  nome_responsavel: z.string().min(1, "Obrigatório").max(255),
  email_responsavel: z.string().email("E-mail inválido").max(255),
  telefone: z.string().optional(),
  cpf_responsavel: z
    .string()
    .min(11, "CPF inválido")
    .max(14)
    .refine((v) => validarCPF(v), "CPF inválido"),
  cnpj: z.string().optional(),
  municipio: z.string().min(1, "Obrigatório").max(100),
  uf: z.enum(UFS_BRASIL, { message: "UF inválida" }),
  fase: z.enum(["IDEACAO", "VALIDACAO"]),
  categoria_setor: z.string().max(100).optional(),
  equipe_descricao: z.string().min(1, "Obrigatório"),
  equipe_quantidade_membros: z.coerce.number().int().min(1).max(50),
  equipe_tempo_dedicacao: z.enum(TEMPO_DEDICACAO_OPTIONS, { message: "Selecione uma opção" }),
  equipe_participa_encontros: z.enum(RESPOSTA_ENCONTROS_OPTIONS, { message: "Selecione uma opção" }),
  mercado_problema: z.string().min(1, "Obrigatório"),
  mercado_conversou_clientes: z.enum(CONVERSA_CLIENTES_OPTIONS, { message: "Selecione uma opção" }),
  mercado_perfil_clientes: z.string().min(1, "Obrigatório"),
  mercado_estimativa_publico: z.string().min(1, "Obrigatório"),
  produto_maturidade: z.enum(MATURIDADE_PROJETO_OPTIONS, { message: "Selecione uma opção" }),
  produto_descricao: z.string().min(1, "Obrigatório"),
  tecnologia_diferencial: z.string().min(1, "Obrigatório"),
  setor_aplicacao_lista: z.enum(SETOR_APLICACAO_OPTIONS, { message: "Selecione um setor" }),
  setor_aplicacao_outro: z.string().optional(),
  url_video_pitch: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Informe uma URL completa (http/https) ou deixe em branco"),
  timestamp_submissao: z.string().min(1, "Data obrigatória"),
}).superRefine((data, ctx) => {
  if (data.setor_aplicacao_lista === "Outro" && !data.setor_aplicacao_outro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["setor_aplicacao_outro"],
      message: "Informe o setor quando selecionar 'Outro'.",
    });
  }
});

export type ProjetoManualInput = z.infer<typeof projetoManualSchema>;
