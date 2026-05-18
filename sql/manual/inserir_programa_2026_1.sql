-- =============================================================================
-- INSERIR MANUALMENTE: Pré incubação SerTão Inovador 2026.1
-- Supabase → SQL Editor → Run
--
-- IMPORTANTE: o trigger da migração 018 bloqueia UPDATE em projetos/resultados
-- enquanto o programa está FINALIZADO. Por isso a ordem é:
--   1) EM_PROCESSO → 2) vincular dados → 3) snapshot → 4) FINALIZADO
-- =============================================================================

-- PASSO 0 — Diagnóstico
SELECT to_regclass('public.programas') IS NOT NULL AS tabela_programas_existe;
SELECT COUNT(*) AS programas FROM public.programas;
SELECT COUNT(*) AS projetos FROM public.projetos;
SELECT COUNT(*) AS resultados FROM public.resultados;

-- Se tabela_programas_existe = false → rode sql/migrations/018_programas_ciclo.sql

-- =============================================================================
-- PASSO 1 — Criar programa como EM_PROCESSO (não FINALIZADO ainda)
-- =============================================================================

INSERT INTO public.programas (
  id,
  nome,
  tipo,
  edital,
  status,
  data_inicio,
  data_fim,
  avaliacoes_inicio,
  avaliacoes_fim,
  prorrogacao_utilizada,
  data_finalizacao,
  total_vagas,
  avaliadores_por_projeto,
  deleted_at
) VALUES (
  'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid,
  'Pré incubação SerTão Inovador 2026.1',
  'PRE_INCUBACAO',
  'Edital nº 45/2026',
  'EM_PROCESSO',
  '2026-01-15',
  '2026-05-15',
  '2026-02-01 00:00:00+00',
  '2026-04-30 23:59:59+00',
  false,
  NULL,
  25,
  2,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  edital = EXCLUDED.edital,
  status = 'EM_PROCESSO',
  data_inicio = EXCLUDED.data_inicio,
  data_fim = EXCLUDED.data_fim,
  avaliacoes_inicio = EXCLUDED.avaliacoes_inicio,
  avaliacoes_fim = EXCLUDED.avaliacoes_fim,
  data_finalizacao = NULL,
  total_vagas = EXCLUDED.total_vagas,
  avaliadores_por_projeto = EXCLUDED.avaliadores_por_projeto,
  deleted_at = NULL;

-- Se você já tinha criado como FINALIZADO antes, desbloqueie explicitamente:
UPDATE public.programas
SET status = 'EM_PROCESSO', data_finalizacao = NULL
WHERE id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid;

SELECT id, nome, status FROM public.programas
WHERE id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

-- =============================================================================
-- PASSO 2 — Vincular projetos e resultados (só funciona com EM_PROCESSO)
-- =============================================================================

UPDATE public.projetos
SET programa_id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid;

UPDATE public.resultados r
SET programa_id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid
FROM public.projetos p
WHERE r.projeto_id = p.id;

SELECT COUNT(*) AS projetos_vinculados
FROM public.projetos
WHERE programa_id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

-- =============================================================================
-- PASSO 3 — Snapshot do ranking (/historico-programas)
-- =============================================================================

INSERT INTO public.programa_resultado_final (
  programa_id,
  projeto_id,
  nome_projeto,
  nome_responsavel,
  municipio,
  is_sertao,
  nota_final,
  media_equipe,
  media_mercado,
  media_produto,
  media_tecnologia,
  posicao_ranking,
  posicao_sertao,
  status_final,
  enquadramento_cota
)
SELECT
  'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid,
  p.id,
  p.nome_projeto,
  p.nome_responsavel,
  p.municipio,
  p.is_sertao,
  r.nota_final,
  r.media_equipe,
  r.media_mercado,
  r.media_produto,
  r.media_tecnologia,
  r.posicao_geral,
  r.posicao_sertao,
  r.status_final,
  r.enquadramento_cota
FROM public.resultados r
JOIN public.projetos p ON p.id = r.projeto_id
ON CONFLICT (programa_id, projeto_id) DO UPDATE SET
  nome_projeto = EXCLUDED.nome_projeto,
  nome_responsavel = EXCLUDED.nome_responsavel,
  municipio = EXCLUDED.municipio,
  is_sertao = EXCLUDED.is_sertao,
  nota_final = EXCLUDED.nota_final,
  media_equipe = EXCLUDED.media_equipe,
  media_mercado = EXCLUDED.media_mercado,
  media_produto = EXCLUDED.media_produto,
  media_tecnologia = EXCLUDED.media_tecnologia,
  posicao_ranking = EXCLUDED.posicao_ranking,
  posicao_sertao = EXCLUDED.posicao_sertao,
  status_final = EXCLUDED.status_final,
  enquadramento_cota = EXCLUDED.enquadramento_cota;

SELECT COUNT(*) AS linhas_no_historico
FROM public.programa_resultado_final
WHERE programa_id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

-- =============================================================================
-- PASSO 4 — Só agora marcar como FINALIZADO
-- =============================================================================

UPDATE public.programas
SET
  status = 'FINALIZADO',
  data_finalizacao = COALESCE(data_finalizacao, now())
WHERE id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid;

UPDATE public.app_config
SET programa_nome = 'Pré incubação SerTão Inovador 2026.1'
WHERE id = 1;

SELECT id, nome, status, data_finalizacao FROM public.programas
WHERE id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
