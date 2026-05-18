-- Registra a 1ª edição já concluída antes do ciclo de programas (018).
-- Todos os projetos, avaliações e resultados existentes pertencem a ela.

DO $$
DECLARE
  prog_id uuid;
  prog_count int;
  nome_programa text := 'Pré incubação SerTão Inovador 2026.1';
  edital_programa text := 'Edital nº 45/2026';
  data_fin timestamptz;
BEGIN
  SELECT COUNT(*)::int INTO prog_count FROM public.programas WHERE deleted_at IS NULL;

  SELECT id INTO prog_id
  FROM public.programas
  WHERE deleted_at IS NULL
  ORDER BY criado_em ASC
  LIMIT 1;

  SELECT COALESCE(
    (SELECT c.atualizado_em FROM public.app_config c WHERE c.id = 1 AND c.resultado_final_liberado = true),
    (SELECT MAX(r.gerado_em) FROM public.resultados r),
    now()
  ) INTO data_fin;

  IF prog_id IS NULL THEN
    INSERT INTO public.programas (
      nome,
      tipo,
      edital,
      status,
      data_inicio,
      data_fim,
      avaliacoes_inicio,
      avaliacoes_fim,
      prorrogacao_fim,
      prorrogacao_utilizada,
      data_finalizacao,
      total_vagas,
      avaliadores_por_projeto
    )
    SELECT
      nome_programa,
      'PRE_INCUBACAO'::public.programa_tipo,
      edital_programa,
      'EM_PROCESSO'::public.programa_status,
      COALESCE(c.avaliacoes_inicio::date, CURRENT_DATE - 90),
      COALESCE(c.avaliacoes_fim::date, CURRENT_DATE),
      c.avaliacoes_inicio,
      c.avaliacoes_fim,
      c.prorrogacao_fim,
      COALESCE(c.prorrogacao_utilizada, false),
      NULL,
      COALESCE(c.total_vagas, 25),
      COALESCE(c.avaliadores_por_projeto, 2)
    FROM public.app_config c
    WHERE c.id = 1
    RETURNING id INTO prog_id;
  ELSE
    UPDATE public.programas p
    SET
      nome = nome_programa,
      tipo = 'PRE_INCUBACAO'::public.programa_tipo,
      edital = edital_programa,
      status = 'EM_PROCESSO'::public.programa_status,
      data_inicio = COALESCE(
        (SELECT c.avaliacoes_inicio::date FROM public.app_config c WHERE c.id = 1),
        p.data_inicio
      ),
      data_fim = COALESCE(
        (SELECT c.avaliacoes_fim::date FROM public.app_config c WHERE c.id = 1),
        p.data_fim
      ),
      avaliacoes_inicio = COALESCE(
        (SELECT c.avaliacoes_inicio FROM public.app_config c WHERE c.id = 1),
        p.avaliacoes_inicio
      ),
      avaliacoes_fim = COALESCE(
        (SELECT c.avaliacoes_fim FROM public.app_config c WHERE c.id = 1),
        p.avaliacoes_fim
      ),
      prorrogacao_fim = COALESCE(
        (SELECT c.prorrogacao_fim FROM public.app_config c WHERE c.id = 1),
        p.prorrogacao_fim
      ),
      prorrogacao_utilizada = COALESCE(
        (SELECT c.prorrogacao_utilizada FROM public.app_config c WHERE c.id = 1),
        p.prorrogacao_utilizada
      ),
      data_finalizacao = NULL,
      total_vagas = COALESCE(
        (SELECT c.total_vagas FROM public.app_config c WHERE c.id = 1),
        p.total_vagas
      ),
      avaliadores_por_projeto = COALESCE(
        (SELECT c.avaliadores_por_projeto FROM public.app_config c WHERE c.id = 1),
        p.avaliadores_por_projeto
      )
    WHERE p.id = prog_id;
  END IF;

  -- Vincula todos os dados legados ao programa (única edição existente até aqui).
  IF prog_count <= 1 THEN
    UPDATE public.projetos SET programa_id = prog_id WHERE programa_id IS DISTINCT FROM prog_id;
  ELSE
    UPDATE public.projetos SET programa_id = prog_id WHERE programa_id IS NULL;
  END IF;

  UPDATE public.resultados r
  SET programa_id = p.programa_id
  FROM public.projetos p
  WHERE r.projeto_id = p.id
    AND p.programa_id = prog_id
    AND r.programa_id IS DISTINCT FROM prog_id;

  UPDATE public.resultados r
  SET programa_id = prog_id
  WHERE r.programa_id IS NULL
    AND EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = r.projeto_id AND p.programa_id = prog_id);

  -- Snapshot permanente para /historico-programas
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
    prog_id,
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
  WHERE p.programa_id = prog_id
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

  -- Finaliza só depois de vincular dados (trigger bloqueia UPDATE com programa FINALIZADO).
  UPDATE public.programas
  SET status = 'FINALIZADO'::public.programa_status, data_finalizacao = data_fin
  WHERE id = prog_id;

  -- Mantém app_config alinhado ao programa legado (referência em e-mails legados).
  UPDATE public.app_config
  SET programa_nome = nome_programa
  WHERE id = 1;
END $$;

COMMENT ON TABLE public.programas IS 'Edições/ciclos. A edição 2026.1 foi registrada pela migração 019.';
