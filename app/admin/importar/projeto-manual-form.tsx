"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projetoManualSchema, type ProjetoManualInput } from "@/lib/validations/projeto-manual";
import { actionCadastrarProjetoManual } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UfBrasil } from "@/lib/constants/brasil";

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
              toast.error(e instanceof Error ? e.message : "Erro ao salvar");
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
