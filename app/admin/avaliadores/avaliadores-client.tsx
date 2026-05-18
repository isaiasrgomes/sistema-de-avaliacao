"use client";

import { useMemo, useState } from "react";
import type { Avaliador } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  actionAprovarCadastroAvaliador,
  actionCreateAvaliador,
  actionDeleteAvaliador,
  actionEnviarEmailAvaliadores,
  actionImportarAvaliadoresCSV,
  actionRejeitarCadastroAvaliador,
  actionToggleAvaliador,
  actionUpdateAvaliador,
} from "@/app/actions/avaliadores-crud";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, SectionCardHeader, TableSection } from "@/components/layout/section-card";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";
import { Loader2, Mail } from "lucide-react";

type Row = Avaliador & { carga: number; avaliacoes_finalizadas: number };

type Pendente = { id: string; nome: string; email: string | null; criado_em: string };
type Integrations = { supabaseAdmin: boolean; resend: boolean };
type FiltroStatus = "todos" | "ativo" | "inativo";
type ModoDestinatarios = "todos" | "selecionados" | "filtro";

export function AvaliadoresClient({
  initial,
  cadastrosPendentes,
  integrations,
}: {
  initial: Row[];
  cadastrosPendentes: Pendente[];
  integrations: Integrations;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [inst, setInst] = useState("");
  const [csvText, setCsvText] = useState("");
  const [editando, setEditando] = useState<Row | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editInst, setEditInst] = useState("");
  const [aExcluir, setAExcluir] = useState<Row | null>(null);
  const [filtroTabela, setFiltroTabela] = useState<FiltroStatus>("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modalEmail, setModalEmail] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modoDestinatarios, setModoDestinatarios] = useState<ModoDestinatarios>("selecionados");
  const [filtroDestinatario, setFiltroDestinatario] = useState<"ativo" | "inativo">("ativo");
  const [assuntoEmail, setAssuntoEmail] = useState("");
  const [mensagemEmail, setMensagemEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  const avaliadoresFiltrados = useMemo(() => {
    if (filtroTabela === "ativo") return initial.filter((a) => a.ativo);
    if (filtroTabela === "inativo") return initial.filter((a) => !a.ativo);
    return initial;
  }, [initial, filtroTabela]);

  const idsDestinatarios = useMemo(() => {
    if (modoDestinatarios === "todos") return initial.map((a) => a.id);
    if (modoDestinatarios === "selecionados") return [...selecionados];
    return initial.filter((a) => (filtroDestinatario === "ativo" ? a.ativo : !a.ativo)).map((a) => a.id);
  }, [modoDestinatarios, selecionados, filtroDestinatario, initial]);

  const todosVisiveisSelecionados =
    avaliadoresFiltrados.length > 0 && avaliadoresFiltrados.every((a) => selecionados.has(a.id));
  const algunsVisiveisSelecionados =
    avaliadoresFiltrados.some((a) => selecionados.has(a.id)) && !todosVisiveisSelecionados;

  function toggleSelecionarTodos(checked: boolean) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      for (const a of avaliadoresFiltrados) {
        if (checked) next.add(a.id);
        else next.delete(a.id);
      }
      return next;
    });
  }

  function toggleSelecionado(id: string, checked: boolean) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function abrirModalEmail() {
    setModoDestinatarios(selecionados.size > 0 ? "selecionados" : "todos");
    setModalEmail(true);
  }

  function baixarModeloCsv() {
    const modelo =
      "nome,email\nNome Exemplo,avaliador@exemplo.com\nOutro Avaliador,outro@exemplo.com\n";
    const blob = new Blob([modelo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-avaliadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <SectionCard>
        <p className="text-sm font-medium text-foreground">Status das integrações</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge
            variant={integrations.supabaseAdmin ? "default" : "outline"}
            className={
              integrations.supabaseAdmin
                ? undefined
                : "border-destructive/50 bg-destructive/10 text-destructive"
            }
          >
            Supabase Admin: {integrations.supabaseAdmin ? "OK" : "Pendente"}
          </Badge>
          <Badge variant={integrations.resend ? "default" : "secondary"}>
            Resend (e-mail): {integrations.resend ? "OK" : "Não configurado"}
          </Badge>
        </div>
        {!integrations.supabaseAdmin && (
          <p className="mt-2 text-xs text-muted-foreground">
            Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor.
          </p>
        )}
        {!integrations.resend && (
          <p className="mt-1 text-xs text-muted-foreground">
            Configure <code>RESEND_API_KEY</code> e <code>EMAIL_FROM</code> para envio automático das credenciais.
          </p>
        )}
      </SectionCard>

      {cadastrosPendentes.length > 0 && (
        <SectionCard className="border-amber-500/40 bg-amber-500/5" padding={false}>
          <SectionCardHeader
            className="border-amber-500/20 px-4 pt-4 sm:px-5"
            title="Cadastros aguardando aprovação"
            description="Ao aprovar, o avaliador poderá entrar na área restrita e será criada ou atualizada a linha correspondente nesta lista. Se não aceitar o cadastro, a pessoa verá um aviso ao entrar e não terá acesso à avaliação."
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cadastrosPendentes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>{p.email ?? "—"}</TableCell>
                  <TableCell>{new Date(p.criado_em).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await actionAprovarCadastroAvaliador(p.id);
                            toast.success("Cadastro aprovado.");
                            window.location.reload();
                          } catch (e: unknown) {
                            toast.error(getUserFriendlyErrorMessage(e, "Não foi possível aprovar o cadastro."));
                          }
                        }}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Não aceitar este cadastro? A pessoa não poderá acessar a área do avaliador neste edital."
                            )
                          ) {
                            return;
                          }
                          try {
                            await actionRejeitarCadastroAvaliador(p.id);
                            toast.success("Cadastro não aceito.");
                            window.location.reload();
                          } catch (e: unknown) {
                            toast.error(getUserFriendlyErrorMessage(e, "Não foi possível atualizar o cadastro."));
                          }
                        }}
                      >
                        Não aceitar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      <SectionCard className="flex flex-wrap gap-2">
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full sm:max-w-xs" />
        <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full sm:max-w-xs" />
        <Input
          placeholder="Senha (opcional)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full sm:max-w-xs"
          type="password"
        />
        <Input
          placeholder="Instituição"
          value={inst}
          onChange={(e) => setInst(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Button
          className="w-full sm:w-auto"
          onClick={async () => {
            try {
              const res = await actionCreateAvaliador({ nome, email, senha, instituicao: inst });
              if (res?.avisoCredenciais) {
                console.warn(res.avisoCredenciais);
                toast.warning(res.avisoCredenciais, { duration: 25000 });
              } else {
                toast.success("Avaliador criado");
              }
              window.location.reload();
            } catch (e: unknown) {
              toast.error(getUserFriendlyErrorMessage(e, "Não foi possível adicionar o avaliador."));
            }
          }}
        >
          Adicionar
        </Button>
      </SectionCard>
      <SectionCard className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Importar CSV de avaliadores com cabeçalhos contendo <code>nome</code> e <code>email</code> (por exemplo:
          <code> 1. Nome Completo</code> e <code>2. E-mail</code> do Google Forms). O sistema gera senha aleatória e
          envia e-mail com as credenciais.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={baixarModeloCsv}>
            Baixar modelo CSV
          </Button>
          <Input
            type="file"
            accept=".csv,text/csv"
            className="max-w-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const content = await file.text();
              setCsvText(content);
              toast.success(`Arquivo carregado: ${file.name}`);
            }}
          />
        </div>
        <Textarea
          className="min-h-28"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"nome,email\nMaria,maria@email.com\nJoão,joao@email.com"}
        />
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={!csvText.trim()}
            onClick={async () => {
              try {
                const res = await actionImportarAvaliadoresCSV(csvText);
                if (res.erros.length) {
                  toast.warning(
                    `Importação concluída com avisos. Inseridos: ${res.inseridos}. Atualizados: ${res.atualizados}. Ignorados: ${res.ignorados}.`
                  );
                  console.warn(res.erros);
                } else {
                  toast.success(
                    `Importação concluída. Inseridos: ${res.inseridos}. Atualizados: ${res.atualizados}. Ignorados: ${res.ignorados}.`
                  );
                }
                window.location.reload();
              } catch (e: unknown) {
                toast.error(getUserFriendlyErrorMessage(e, "Não foi possível importar o CSV."));
              }
            }}
          >
            Importar CSV de avaliadores
          </Button>
        </div>
      </SectionCard>
      <TableSection
        toolbar={
          <DataTableToolbar
            filters={
              <>
                <Select
                  value={filtroTabela}
                  onChange={(e) => setFiltroTabela(e.target.value as FiltroStatus)}
                  className="h-9 w-auto min-w-[10rem]"
                >
                  <option value="todos">Todos na lista</option>
                  <option value="ativo">Somente ativos</option>
                  <option value="inativo">Somente inativos</option>
                </Select>
                <p className="text-sm text-muted-foreground">
                  ✅ {selecionados.size} avaliador{selecionados.size === 1 ? "" : "es"} selecionado
                  {selecionados.size === 1 ? "" : "s"}
                </p>
              </>
            }
            actions={
              <Button onClick={abrirModalEmail} disabled={!integrations.resend || initial.length === 0}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar e-mail
              </Button>
            }
          />
        }
      >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                checked={todosVisiveisSelecionados}
                ref={(el) => {
                  if (el) el.indeterminate = algunsVisiveisSelecionados;
                }}
                onChange={(e) => toggleSelecionarTodos(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead>Avaliações finalizadas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {avaliadoresFiltrados.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${a.nome}`}
                  checked={selecionados.has(a.id)}
                  onChange={(e) => toggleSelecionado(a.id, e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              </TableCell>
              <TableCell>{a.nome}</TableCell>
              <TableCell>{a.email}</TableCell>
              <TableCell>{a.carga}</TableCell>
              <TableCell>{a.avaliacoes_finalizadas}</TableCell>
              <TableCell>
                <StatusBadge status={a.ativo ? "ATIVO" : "INATIVO"} label={a.ativo ? "Ativo" : "Inativo"} />
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button size="sm" variant="outline" onClick={() => actionToggleAvaliador(a.id, !a.ativo).then(() => window.location.reload())}>
                  {a.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditando(a);
                    setEditNome(a.nome);
                    setEditEmail(a.email);
                    setEditInst(a.instituicao ?? "");
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setAExcluir(a);
                  }}
                >
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableSection>

      <Dialog
        open={modalEmail}
        onOpenChange={(open) => {
          if (!open && !enviando) setModalEmail(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar e-mail para avaliadores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Destinatários</p>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="modo-destinatarios"
                  checked={modoDestinatarios === "todos"}
                  onChange={() => setModoDestinatarios("todos")}
                  className="mt-1"
                />
                <span>
                  Todos os avaliadores <span className="text-muted-foreground">({initial.length})</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="modo-destinatarios"
                  checked={modoDestinatarios === "selecionados"}
                  onChange={() => setModoDestinatarios("selecionados")}
                  disabled={selecionados.size === 0}
                  className="mt-1"
                />
                <span>
                  Avaliadores selecionados manualmente{" "}
                  <span className="text-muted-foreground">({selecionados.size})</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="modo-destinatarios"
                  checked={modoDestinatarios === "filtro"}
                  onChange={() => setModoDestinatarios("filtro")}
                  className="mt-1"
                />
                <span className="flex flex-wrap items-center gap-2">
                  Grupo por status:
                  <Select
                    value={filtroDestinatario}
                    onChange={(e) => setFiltroDestinatario(e.target.value as "ativo" | "inativo")}
                    disabled={modoDestinatarios !== "filtro"}
                    className="h-8 w-auto min-w-[7rem] px-2 text-sm"
                    onClick={() => setModoDestinatarios("filtro")}
                  >
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                  </Select>
                  <span className="text-muted-foreground">
                    (
                    {initial.filter((a) => (filtroDestinatario === "ativo" ? a.ativo : !a.ativo)).length})
                  </span>
                </span>
              </label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-assunto">Assunto *</Label>
              <Input
                id="email-assunto"
                value={assuntoEmail}
                onChange={(e) => setAssuntoEmail(e.target.value)}
                placeholder="Assunto do e-mail"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-mensagem">Mensagem personalizada *</Label>
              <Textarea
                id="email-mensagem"
                value={mensagemEmail}
                onChange={(e) => setMensagemEmail(e.target.value)}
                placeholder="Digite a mensagem. Quebras de linha serão preservadas."
                className="min-h-32"
                required
              />
              <p className="text-xs text-muted-foreground">
                O e-mail usará o layout padrão do sistema (logo, cabeçalho e rodapé). Apenas o texto acima será
                inserido no corpo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEmail(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              disabled={!assuntoEmail.trim() || !mensagemEmail.trim() || idsDestinatarios.length === 0}
              onClick={() => {
                if (!assuntoEmail.trim() || !mensagemEmail.trim()) {
                  toast.error("Preencha assunto e mensagem.");
                  return;
                }
                if (idsDestinatarios.length === 0) {
                  toast.error("Selecione ao menos um destinatário.");
                  return;
                }
                setModalConfirmar(true);
              }}
            >
              Revisar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalConfirmar}
        onOpenChange={(open) => {
          if (!open && !enviando) setModalConfirmar(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja enviar este e-mail para{" "}
            <strong>{idsDestinatarios.length}</strong> avaliador{idsDestinatarios.length === 1 ? "" : "es"}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfirmar(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              disabled={enviando}
              onClick={async () => {
                setEnviando(true);
                try {
                  const resultado = await actionEnviarEmailAvaliadores({
                    avaliadorIds: idsDestinatarios,
                    assunto: assuntoEmail,
                    mensagem: mensagemEmail,
                  });
                  if (resultado.erros.length) {
                    toast.warning(
                      `Enviados ${resultado.enviados} de ${resultado.total}. ${resultado.erros.length} falha(s). Verifique o console para detalhes.`
                    );
                    console.warn(resultado.erros);
                  } else {
                    toast.success(`E-mail enviado para ${resultado.enviados} avaliador(es).`);
                  }
                  setModalConfirmar(false);
                  setModalEmail(false);
                  setAssuntoEmail("");
                  setMensagemEmail("");
                  setSelecionados(new Set());
                } catch (e: unknown) {
                  toast.error(getUserFriendlyErrorMessage(e, "Não foi possível enviar os e-mails."));
                } finally {
                  setEnviando(false);
                }
              }}
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                "Confirmar envio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editando}
        onOpenChange={(open) => {
          if (!open) setEditando(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar avaliador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-inst">Instituição</Label>
              <Input id="edit-inst" value={editInst} onChange={(e) => setEditInst(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editando) return;
                try {
                  await actionUpdateAvaliador(editando.id, {
                    nome: editNome,
                    email: editEmail,
                    instituicao: editInst || undefined,
                  });
                  toast.success("Avaliador atualizado.");
                  window.location.reload();
                } catch (e: unknown) {
                  toast.error(getUserFriendlyErrorMessage(e, "Não foi possível atualizar o avaliador."));
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!aExcluir}
        onOpenChange={(open) => {
          if (!open) setAExcluir(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Excluir o avaliador {aExcluir ? `"${aExcluir.nome}"` : ""}? As atribuições desse avaliador podem ficar
            incompletas e exigir redistribuição.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAExcluir(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!aExcluir) return;
                try {
                  await actionDeleteAvaliador(aExcluir.id);
                  toast.success("Avaliador excluído.");
                  window.location.reload();
                } catch (e: unknown) {
                  toast.error(getUserFriendlyErrorMessage(e, "Não foi possível excluir o avaliador."));
                }
              }}
            >
              Excluir avaliador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
