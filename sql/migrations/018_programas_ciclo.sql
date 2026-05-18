-- Múltiplos programas (edições), snapshot de resultado final e vínculo de dados.

DO $$ BEGIN
  CREATE TYPE public.programa_tipo AS ENUM ('INCUBACAO', 'PRE_INCUBACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.programa_status AS ENUM ('EM_PROCESSO', 'FINALIZADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo public.programa_tipo NOT NULL,
  edital text NOT NULL,
  status public.programa_status NOT NULL DEFAULT 'EM_PROCESSO'::public.programa_status,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  avaliacoes_inicio timestamptz,
  avaliacoes_fim timestamptz,
  prorrogacao_fim timestamptz,
  prorrogacao_utilizada boolean NOT NULL DEFAULT false,
  data_finalizacao timestamptz,
  total_vagas int NOT NULL DEFAULT 25 CHECK (total_vagas >= 1),
  avaliadores_por_projeto int NOT NULL DEFAULT 2 CHECK (avaliadores_por_projeto >= 1 AND avaliadores_por_projeto <= 15),
  deleted_at timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programas_status ON public.programas (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_programas_criado ON public.programas (criado_em DESC);

CREATE TABLE IF NOT EXISTS public.programa_resultado_final (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id uuid NOT NULL REFERENCES public.programas (id) ON DELETE RESTRICT,
  projeto_id uuid NOT NULL REFERENCES public.projetos (id) ON DELETE RESTRICT,
  nome_projeto text NOT NULL,
  nome_responsavel text NOT NULL,
  municipio text NOT NULL,
  is_sertao boolean NOT NULL DEFAULT false,
  nota_final numeric(5,2) NOT NULL,
  media_equipe numeric(5,2) NOT NULL,
  media_mercado numeric(5,2) NOT NULL,
  media_produto numeric(5,2) NOT NULL,
  media_tecnologia numeric(5,2) NOT NULL,
  posicao_ranking int,
  posicao_sertao int,
  status_final public.resultado_status_final NOT NULL DEFAULT 'NAO_SELECIONADO'::public.resultado_status_final,
  enquadramento_cota boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programa_id, projeto_id)
);

CREATE INDEX IF NOT EXISTS idx_programa_resultado_programa ON public.programa_resultado_final (programa_id, posicao_ranking);

ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS programa_id uuid REFERENCES public.programas (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_projetos_programa ON public.projetos (programa_id);

ALTER TABLE public.resultados
  ADD COLUMN IF NOT EXISTS programa_id uuid REFERENCES public.programas (id) ON DELETE RESTRICT;

-- Migração: programa padrão a partir de app_config
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
  prorrogacao_fim,
  prorrogacao_utilizada,
  total_vagas,
  avaliadores_por_projeto
)
SELECT
  gen_random_uuid(),
  COALESCE(c.programa_nome, 'Programa SerTão Inovador'),
  'PRE_INCUBACAO'::public.programa_tipo,
  'Edital 45/2026',
  'EM_PROCESSO'::public.programa_status,
  COALESCE(c.avaliacoes_inicio::date, CURRENT_DATE),
  COALESCE(c.avaliacoes_fim::date, CURRENT_DATE + interval '90 days'),
  c.avaliacoes_inicio,
  c.avaliacoes_fim,
  c.prorrogacao_fim,
  COALESCE(c.prorrogacao_utilizada, false),
  COALESCE(c.total_vagas, 25),
  COALESCE(c.avaliadores_por_projeto, 2)
FROM public.app_config c
WHERE c.id = 1
  AND NOT EXISTS (SELECT 1 FROM public.programas p WHERE p.deleted_at IS NULL);

UPDATE public.projetos p
SET programa_id = sub.id
FROM (SELECT id FROM public.programas WHERE deleted_at IS NULL ORDER BY criado_em ASC LIMIT 1) sub
WHERE p.programa_id IS NULL AND sub.id IS NOT NULL;

UPDATE public.resultados r
SET programa_id = p.programa_id
FROM public.projetos p
WHERE r.projeto_id = p.id AND r.programa_id IS NULL AND p.programa_id IS NOT NULL;

-- Bloqueio de alterações em programas finalizados
CREATE OR REPLACE FUNCTION public.programa_id_do_projeto(pid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT programa_id FROM public.projetos WHERE id = pid;
$$;

CREATE OR REPLACE FUNCTION public.programa_esta_finalizado(pid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.programas pr
    WHERE pr.id = pid AND pr.status = 'FINALIZADO'::public.programa_status AND pr.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.trg_bloqueia_se_programa_finalizado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prog_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'projetos' THEN
    prog_id := COALESCE(NEW.programa_id, OLD.programa_id);
  ELSIF TG_TABLE_NAME = 'atribuicoes' THEN
    prog_id := public.programa_id_do_projeto(COALESCE(NEW.projeto_id, OLD.projeto_id));
  ELSIF TG_TABLE_NAME = 'avaliacoes' THEN
    SELECT public.programa_id_do_projeto(a.projeto_id) INTO prog_id
    FROM public.atribuicoes a
    WHERE a.id = COALESCE(NEW.atribuicao_id, OLD.atribuicao_id);
  ELSIF TG_TABLE_NAME = 'resultados' THEN
    prog_id := COALESCE(NEW.programa_id, OLD.programa_id, public.programa_id_do_projeto(COALESCE(NEW.projeto_id, OLD.projeto_id)));
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF prog_id IS NOT NULL AND public.programa_esta_finalizado(prog_id) THEN
    RAISE EXCEPTION 'Programa finalizado: alterações não permitidas.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS projetos_bloqueia_finalizado ON public.projetos;
CREATE TRIGGER projetos_bloqueia_finalizado
  BEFORE UPDATE OR DELETE ON public.projetos
  FOR EACH ROW EXECUTE PROCEDURE public.trg_bloqueia_se_programa_finalizado();

DROP TRIGGER IF EXISTS atribuicoes_bloqueia_finalizado ON public.atribuicoes;
CREATE TRIGGER atribuicoes_bloqueia_finalizado
  BEFORE INSERT OR UPDATE OR DELETE ON public.atribuicoes
  FOR EACH ROW EXECUTE PROCEDURE public.trg_bloqueia_se_programa_finalizado();

DROP TRIGGER IF EXISTS avaliacoes_bloqueia_finalizado ON public.avaliacoes;
CREATE TRIGGER avaliacoes_bloqueia_finalizado
  BEFORE INSERT OR UPDATE OR DELETE ON public.avaliacoes
  FOR EACH ROW EXECUTE PROCEDURE public.trg_bloqueia_se_programa_finalizado();

DROP TRIGGER IF EXISTS resultados_bloqueia_finalizado ON public.resultados;
CREATE TRIGGER resultados_bloqueia_finalizado
  BEFORE INSERT OR UPDATE OR DELETE ON public.resultados
  FOR EACH ROW EXECUTE PROCEDURE public.trg_bloqueia_se_programa_finalizado();

-- RLS programas
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_resultado_final ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS programas_all_coord ON public.programas;
CREATE POLICY programas_all_coord ON public.programas FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());

DROP POLICY IF EXISTS programas_select_finalizado_anon ON public.programas;
CREATE POLICY programas_select_finalizado_anon ON public.programas FOR SELECT
  TO anon
  USING (status = 'FINALIZADO'::public.programa_status AND deleted_at IS NULL);

DROP POLICY IF EXISTS programa_resultado_coord ON public.programa_resultado_final;
CREATE POLICY programa_resultado_coord ON public.programa_resultado_final FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());

DROP POLICY IF EXISTS programa_resultado_select_anon ON public.programa_resultado_final;
CREATE POLICY programa_resultado_select_anon ON public.programa_resultado_final FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.programas pr
      WHERE pr.id = programa_resultado_final.programa_id
        AND pr.status = 'FINALIZADO'::public.programa_status
        AND pr.deleted_at IS NULL
    )
  );

COMMENT ON TABLE public.programas IS 'Edições/ciclos do programa (ex.: Pré-Incubação 2026.1)';
COMMENT ON TABLE public.programa_resultado_final IS 'Snapshot permanente do ranking ao finalizar o programa';
