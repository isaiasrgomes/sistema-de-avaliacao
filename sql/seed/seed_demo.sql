-- Demonstração: 30 projetos, 10 avaliadores, 2 avaliações concluídas por projeto.
-- Projetos mais antigos na fila (2 primeiros) ficam com CV alto → AGUARDANDO_3O_AVALIADOR.
-- Executar somente em base de teste (apaga dados das tabelas abaixo).

TRUNCATE TABLE
  public.avaliacoes,
  public.atribuicoes,
  public.impedimentos,
  public.resultados,
  public.recursos,
  public.logs_auditoria,
  public.projetos,
  public.avaliadores,
  public.municipios_sertao
RESTART IDENTITY CASCADE;

INSERT INTO public.municipios_sertao (municipio) VALUES
  ('Petrolina'), ('Serra Talhada'), ('Arcoverde'), ('Afogados da Ingazeira'), ('Ouricuri');

INSERT INTO public.avaliadores (nome, email, instituicao, ativo) VALUES
  ('Avaliador 1', 'av1@demo.local', 'Inst A', true),
  ('Avaliador 2', 'av2@demo.local', 'Inst B', true),
  ('Avaliador 3', 'av3@demo.local', 'Inst C', true),
  ('Avaliador 4', 'av4@demo.local', 'Inst D', true),
  ('Avaliador 5', 'av5@demo.local', 'Inst E', true),
  ('Avaliador 6', 'av6@demo.local', 'Inst F', true),
  ('Avaliador 7', 'av7@demo.local', 'Inst G', true),
  ('Avaliador 8', 'av8@demo.local', 'Inst H', true),
  ('Avaliador 9', 'av9@demo.local', 'Inst I', true),
  ('Avaliador 10', 'av10@demo.local', 'Inst J', true);

INSERT INTO public.projetos (
  nome_projeto, nome_responsavel, email_responsavel, cpf_responsavel, municipio, uf, fase, categoria_setor,
  is_sertao, timestamp_submissao, status
)
SELECT
  'Projeto Demo ' || g,
  'Responsável ' || g,
  'resp' || g || '@demo.local',
  lpad(g::text, 11, '0'),
  CASE WHEN g % 3 = 0 THEN 'Petrolina' WHEN g % 3 = 1 THEN 'Recife' ELSE 'Caruaru' END,
  'PE',
  CASE WHEN g % 2 = 0 THEN 'IDEACAO'::public.projeto_fase ELSE 'VALIDACAO'::public.projeto_fase END,
  'Inovação',
  (g % 3 = 0),
  now() - (g || ' days')::interval,
  'EM_AVALIACAO'::public.projeto_status
FROM generate_series(1, 30) g;

WITH p AS (
  SELECT id, row_number() OVER (ORDER BY timestamp_submissao) AS rn FROM public.projetos
),
a AS (
  SELECT id, row_number() OVER (ORDER BY nome) AS rn FROM public.avaliadores
)
INSERT INTO public.atribuicoes (avaliador_id, projeto_id, ordem, status)
SELECT a1.id, p.id, 1, 'CONCLUIDA'::public.atribuicao_status
FROM p
JOIN a a1 ON a1.rn = ((p.rn - 1) % 10) + 1
UNION ALL
SELECT a2.id, p.id, 2, 'CONCLUIDA'::public.atribuicao_status
FROM p
JOIN a a2 ON a2.rn = ((p.rn) % 10) + 1;

INSERT INTO public.avaliacoes (
  atribuicao_id, nota_equipe, nota_mercado, nota_produto, nota_tecnologia,
  justificativa_geral, observacoes_gerais, nota_total_ponderada
)
SELECT
  att.id,
  CASE WHEN sub.rn <= 2 AND att.ordem = 1 THEN 1 ELSE 3 END,
  CASE WHEN sub.rn <= 2 AND att.ordem = 1 THEN 1 ELSE 3 END,
  CASE WHEN sub.rn <= 2 AND att.ordem = 1 THEN 1 ELSE 3 END,
  CASE WHEN sub.rn <= 2 AND att.ordem = 1 THEN 1 ELSE 3 END,
  'Justificativa de demonstração para o edital.',
  'Observações gerais demo.',
  0
FROM public.atribuicoes att
JOIN public.projetos p ON p.id = att.projeto_id
JOIN (
  SELECT id, row_number() OVER (ORDER BY timestamp_submissao) AS rn FROM public.projetos
) sub ON sub.id = p.id;

UPDATE public.avaliacoes v
SET
  nota_equipe = 5,
  nota_mercado = 5,
  nota_produto = 5,
  nota_tecnologia = 5
FROM public.atribuicoes att
JOIN (
  SELECT id, row_number() OVER (ORDER BY timestamp_submissao) AS rn FROM public.projetos
) sub ON sub.id = att.projeto_id
WHERE v.atribuicao_id = att.id AND sub.rn <= 2 AND att.ordem = 2;

UPDATE public.projetos SET status = 'AGUARDANDO_3O_AVALIADOR'
WHERE id IN (SELECT id FROM public.projetos ORDER BY timestamp_submissao ASC LIMIT 2);

UPDATE public.projetos SET status = 'AVALIADO'
WHERE id NOT IN (SELECT id FROM public.projetos ORDER BY timestamp_submissao ASC LIMIT 2);
