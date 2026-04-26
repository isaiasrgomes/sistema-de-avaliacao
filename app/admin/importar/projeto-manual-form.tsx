"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projetoManualSchema, type ProjetoManualInput } from "@/lib/validations/projeto-manual";
import { actionCadastrarProjetoManual } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UfBrasil } from "@/lib/constants/brasil";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";
import {
  CONVERSA_CLIENTES_OPTIONS,
  RESPOSTA_ENCONTROS_OPTIONS,
  SETOR_APLICACAO_OPTIONS,
  TEMPO_DEDICACAO_OPTIONS,
} from "@/lib/constants/projeto-inscricao";

function somenteDigitos(v: string) {
  return v.replace(/\D/g, "");
}

function mascaraCpf(v: string) {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function defaultTimestampLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ProjetoManualForm({ municipios, ufs }: { municipios: string[]; ufs: string[] }) {
  const defaults = useMemo<ProjetoManualInput>(
    () => ({
      nome_projeto: "",
      nome_responsavel: "",
      email_responsavel: "",
      telefone: "",
      cpf_responsavel: "",
      cnpj: "",
      municipio: "",
      uf: "PE",
      fase: "IDEACAO",
      categoria_setor: "",
      equipe_descricao: "",
      equipe_quantidade_membros: 1,
      equipe_tempo_dedicacao: TEMPO_DEDICACAO_OPTIONS[0],
      equipe_participa_encontros: RESPOSTA_ENCONTROS_OPTIONS[0],
      mercado_problema: "",
      mercado_conversou_clientes: CONVERSA_CLIENTES_OPTIONS[0],
      mercado_perfil_clientes: "",
      mercado_estimativa_publico: "",
      tecnologia_diferencial: "",
      setor_aplicacao_lista: SETOR_APLICACAO_OPTIONS[0],
      setor_aplicacao_outro: "",
      url_video_pitch: "",
      timestamp_submissao: defaultTimestampLocal(),
    }),
    []
  );

  const form = useForm<ProjetoManualInput>({
    resolver: zodResolver(projetoManualSchema),
    defaultValues: defaults,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro manual</CardTitle>
        <CardDescription>
          <strong>Cota Sertão</strong> é definida automaticamente conforme o município está na tabela de municípios do
          Sertão. Se já existir projeto com o mesmo CPF e
          mesmo nome do projeto, o registro será <strong>atualizado</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (data) => {
            try {
              const r = await actionCadastrarProjetoManual(data);
              toast.success(r.tipo === "inserido" ? "Projeto inscrito com sucesso." : "Projeto atualizado (mesmo CPF + nome).");
              form.reset({ ...defaults, timestamp_submissao: defaultTimestampLocal() });
            } catch (e: unknown) {
              toast.error(getUserFriendlyErrorMessage(e, "Não foi possível salvar a inscrição."));
            }
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome_projeto">Nome do projeto *</Label>
              <Input id="nome_projeto" {...form.register("nome_projeto")} />
              {form.formState.errors.nome_projeto && (
                <p className="text-xs text-destructive">{form.formState.errors.nome_projeto.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_responsavel">Nome do responsável *</Label>
              <Input id="nome_responsavel" {...form.register("nome_responsavel")} />
              {form.formState.errors.nome_responsavel && (
                <p className="text-xs text-destructive">{form.formState.errors.nome_responsavel.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_responsavel">E-mail do responsável *</Label>
              <Input id="email_responsavel" type="email" {...form.register("email_responsavel")} />
              {form.formState.errors.email_responsavel && (
                <p className="text-xs text-destructive">{form.formState.errors.email_responsavel.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf_responsavel">CPF do responsável *</Label>
              <Input
                id="cpf_responsavel"
                placeholder="000.000.000-00"
                value={form.watch("cpf_responsavel") ?? ""}
                onChange={(e) => form.setValue("cpf_responsavel", mascaraCpf(e.target.value), { shouldValidate: true })}
              />
              {form.formState.errors.cpf_responsavel && (
                <p className="text-xs text-destructive">{form.formState.errors.cpf_responsavel.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(00) 00000-0000" {...form.register("telefone")} />
              {form.formState.errors.telefone && (
                <p className="text-xs text-destructive">{form.formState.errors.telefone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...form.register("cnpj")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Município *</Label>
              <Input
                id="municipio"
                list="municipios-brasil"
                placeholder="Digite para buscar..."
                {...form.register("municipio")}
              />
              <datalist id="municipios-brasil">
                {municipios.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {form.formState.errors.municipio && (
                <p className="text-xs text-destructive">{form.formState.errors.municipio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF *</Label>
              <Input
                id="uf"
                list="ufs-brasil"
                placeholder="Digite para buscar..."
                maxLength={2}
                value={form.watch("uf") ?? ""}
                onChange={(e) =>
                  form.setValue("uf", e.target.value.toUpperCase() as UfBrasil, { shouldValidate: true })
                }
              />
              <datalist id="ufs-brasil">
                {ufs.map((uf) => (
                  <option key={uf} value={uf} />
                ))}
              </datalist>
              {form.formState.errors.uf && <p className="text-xs text-destructive">{form.formState.errors.uf.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fase">Fase *</Label>
              <select
                id="fase"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("fase")}
              >
                <option value="IDEACAO">Ideação</option>
                <option value="VALIDACAO">Validação</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="categoria_setor">Categoria / setor *</Label>
              <Input id="categoria_setor" {...form.register("categoria_setor")} />
              {form.formState.errors.categoria_setor && (
                <p className="text-xs text-destructive">{form.formState.errors.categoria_setor.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="equipe_descricao">Equipe empreendedora: descrição *</Label>
              <Textarea id="equipe_descricao" rows={4} {...form.register("equipe_descricao")} />
              {form.formState.errors.equipe_descricao && (
                <p className="text-xs text-destructive">{form.formState.errors.equipe_descricao.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipe_quantidade_membros">Quantidade de membros da equipe *</Label>
              <Input
                id="equipe_quantidade_membros"
                type="number"
                min={1}
                max={50}
                {...form.register("equipe_quantidade_membros", { valueAsNumber: true })}
              />
              {form.formState.errors.equipe_quantidade_membros && (
                <p className="text-xs text-destructive">{form.formState.errors.equipe_quantidade_membros.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipe_tempo_dedicacao">Tempo dedicado ao projeto *</Label>
              <select
                id="equipe_tempo_dedicacao"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("equipe_tempo_dedicacao")}
              >
                {TEMPO_DEDICACAO_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipe_participa_encontros">Participa de encontros obrigatórios? *</Label>
              <select
                id="equipe_participa_encontros"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("equipe_participa_encontros")}
              >
                {RESPOSTA_ENCONTROS_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mercado_problema">Problema/oportunidade de mercado *</Label>
              <Textarea id="mercado_problema" rows={4} {...form.register("mercado_problema")} />
              {form.formState.errors.mercado_problema && (
                <p className="text-xs text-destructive">{form.formState.errors.mercado_problema.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mercado_conversou_clientes">Você já conversou com potenciais clientes? *</Label>
              <select
                id="mercado_conversou_clientes"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("mercado_conversou_clientes")}
              >
                {CONVERSA_CLIENTES_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mercado_perfil_clientes">Primeiros clientes (perfil) *</Label>
              <Textarea id="mercado_perfil_clientes" rows={3} {...form.register("mercado_perfil_clientes")} />
              {form.formState.errors.mercado_perfil_clientes && (
                <p className="text-xs text-destructive">{form.formState.errors.mercado_perfil_clientes.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mercado_estimativa_publico">Estimativa de público interessado *</Label>
              <Input id="mercado_estimativa_publico" {...form.register("mercado_estimativa_publico")} />
              {form.formState.errors.mercado_estimativa_publico && (
                <p className="text-xs text-destructive">{form.formState.errors.mercado_estimativa_publico.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tecnologia_diferencial">Tecnologia e diferencial *</Label>
              <Textarea id="tecnologia_diferencial" rows={4} {...form.register("tecnologia_diferencial")} />
              {form.formState.errors.tecnologia_diferencial && (
                <p className="text-xs text-destructive">{form.formState.errors.tecnologia_diferencial.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="setor_aplicacao_lista">Setor de aplicação da solução (dropdown) *</Label>
              <select
                id="setor_aplicacao_lista"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("setor_aplicacao_lista")}
              >
                {SETOR_APLICACAO_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              {form.formState.errors.setor_aplicacao_lista && (
                <p className="text-xs text-destructive">{form.formState.errors.setor_aplicacao_lista.message}</p>
              )}
            </div>
            {form.watch("setor_aplicacao_lista") === "Outro" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="setor_aplicacao_outro">Descreva o setor (Outro) *</Label>
                <Input id="setor_aplicacao_outro" {...form.register("setor_aplicacao_outro")} />
                {form.formState.errors.setor_aplicacao_outro && (
                  <p className="text-xs text-destructive">{form.formState.errors.setor_aplicacao_outro.message}</p>
                )}
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="url_video_pitch">URL do vídeo pitch</Label>
              <Input id="url_video_pitch" type="url" placeholder="https://..." {...form.register("url_video_pitch")} />
              {form.formState.errors.url_video_pitch && (
                <p className="text-xs text-destructive">{form.formState.errors.url_video_pitch.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="timestamp_submissao">Data e hora da submissão *</Label>
              <Input id="timestamp_submissao" type="datetime-local" {...form.register("timestamp_submissao")} />
              {form.formState.errors.timestamp_submissao && (
                <p className="text-xs text-destructive">{form.formState.errors.timestamp_submissao.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando…" : "Salvar inscrição"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
