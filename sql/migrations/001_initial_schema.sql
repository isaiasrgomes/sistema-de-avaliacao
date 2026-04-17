-- Sistema de avaliacao — Edital 45/2026
-- Execute no SQL Editor do Supabase (ordem única)

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== ENUMS ==========
DO $$ BEGIN
  CREATE TYPE public.projeto_fase AS ENUM ('IDEACAO', 'VALIDACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.projeto_status AS ENUM (
    'INSCRITO', 'DESCLASSIFICADO', 'EM_AVALIACAO', 'AGUARDANDO_3O_AVALIADOR',
    'AVALIADO', 'SELECIONADO', 'SUPLENTE', 'NAO_SELECIONADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.impedimento_tipo AS ENUM ('SOCIETARIO', 'PROFISSIONAL', 'PARENTESCO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.declarado_por AS ENUM ('AVALIADOR', 'COORDENADOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.atribuicao_status AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resultado_status_final AS ENUM ('SELECIONADO', 'SUPLENTE', 'NAO_SELECIONADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_role AS ENUM ('COORDENADOR', 'AVALIADOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fase_publicacao AS ENUM ('PRELIMINAR', 'FINAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== HELPER: email do JWT ==========
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(auth.jwt() ->> 'email', ''), NULLIF((auth.jwt() -> 'user_metadata' ->> 'email'), ''));
$$;

-- Nota: is_coordenador() e get_avaliador_id_for_auth() são criadas APÓS as tabelas
-- profiles e avaliadores (funções SQL validam relações na CREATE FUNCTION).

-- ========== TABELAS ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.profile_role NOT NULL DEFAULT 'AVALIADOR'::public.profile_role,
  nome varchar(255) NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.municipios_sertao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio varchar(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.avaliadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  instituicao varchar(255),
  ativo boolean NOT NULL DEFAULT true,
  aceite_confidencialidade boolean NOT NULL DEFAULT false,
  aceite_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- ========== HELPERS RLS (dependem de profiles + avaliadores) ==========
CREATE OR REPLACE FUNCTION public.is_coordenador()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'COORDENADOR'::public.profile_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_avaliador_id_for_auth()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.avaliadores a
  WHERE lower(trim(a.email)) = lower(trim(public.jwt_email()))
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_projeto varchar(255) NOT NULL,
  nome_responsavel varchar(255) NOT NULL,
  email_responsavel varchar(255) NOT NULL,
  telefone varchar(20),
  cpf_responsavel varchar(14) NOT NULL,
  cnpj varchar(18),
  municipio varchar(100) NOT NULL,
  uf varchar(2) NOT NULL DEFAULT 'PE',
  fase public.projeto_fase NOT NULL,
  categoria_setor varchar(100) NOT NULL,
  is_sertao boolean NOT NULL DEFAULT false,
  url_video_pitch varchar(500),
  timestamp_submissao timestamptz NOT NULL,
  status public.projeto_status NOT NULL DEFAULT 'INSCRITO'::public.projeto_status,
  motivo_desclassificacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projetos_status ON public.projetos (status);
CREATE INDEX IF NOT EXISTS idx_projetos_municipio ON public.projetos (municipio);
CREATE INDEX IF NOT EXISTS idx_projetos_cpf ON public.projetos (cpf_responsavel);

CREATE TABLE IF NOT EXISTS public.impedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliador_id uuid NOT NULL REFERENCES public.avaliadores (id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES public.projetos (id) ON DELETE CASCADE,
  tipo public.impedimento_tipo NOT NULL,
  declarado_por public.declarado_por NOT NULL DEFAULT 'AVALIADOR'::public.declarado_por,
  data_declaracao timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliador_id uuid NOT NULL REFERENCES public.avaliadores (id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES public.projetos (id) ON DELETE CASCADE,
  ordem int NOT NULL CHECK (ordem >= 1 AND ordem <= 3),
  status public.atribuicao_status NOT NULL DEFAULT 'PENDENTE'::public.atribuicao_status,
  data_atribuicao timestamptz NOT NULL DEFAULT now(),
  data_conclusao timestamptz,
  UNIQUE (projeto_id, ordem),
  UNIQUE (avaliador_id, projeto_id)
);

CREATE INDEX IF NOT EXISTS idx_atribuicoes_projeto ON public.atribuicoes (projeto_id);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_avaliador ON public.atribuicoes (avaliador_id);

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atribuicao_id uuid NOT NULL UNIQUE REFERENCES public.atribuicoes (id) ON DELETE CASCADE,
  nota_equipe int NOT NULL CHECK (nota_equipe >= 1 AND nota_equipe <= 5),
  nota_mercado int NOT NULL CHECK (nota_mercado >= 1 AND nota_mercado <= 5),
  nota_produto int NOT NULL CHECK (nota_produto >= 1 AND nota_produto <= 5),
  nota_tecnologia int NOT NULL CHECK (nota_tecnologia >= 1 AND nota_tecnologia <= 5),
  justificativa_geral text,
  observacoes_gerais text,
  nota_total_ponderada numeric(5,2) NOT NULL,
  data_avaliacao timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL UNIQUE REFERENCES public.projetos (id) ON DELETE CASCADE,
  nota_final numeric(5,2) NOT NULL,
  media_equipe numeric(5,2) NOT NULL,
  media_mercado numeric(5,2) NOT NULL,
  media_produto numeric(5,2) NOT NULL,
  media_tecnologia numeric(5,2) NOT NULL,
  posicao_geral int,
  posicao_sertao int,
  status_final public.resultado_status_final NOT NULL DEFAULT 'NAO_SELECIONADO'::public.resultado_status_final,
  enquadramento_cota boolean NOT NULL DEFAULT false,
  gerado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos (id) ON DELETE CASCADE,
  descricao text NOT NULL,
  data_recebimento timestamptz NOT NULL DEFAULT now(),
  parecer_coordenador text,
  deferido boolean NOT NULL DEFAULT false,
  alteracao_nota boolean NOT NULL DEFAULT false,
  nota_ajustada numeric(5,2)
);

CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  acao varchar(255) NOT NULL,
  entidade varchar(100) NOT NULL,
  entidade_id uuid,
  detalhes jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_criado ON public.logs_auditoria (criado_em DESC);

-- Configuração global (vagas, fase de publicação)
CREATE TABLE IF NOT EXISTS public.app_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_vagas int NOT NULL DEFAULT 25,
  fase_publicacao public.fase_publicacao NOT NULL DEFAULT 'PRELIMINAR'::public.fase_publicacao,
  resultado_final_liberado boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- View pública (somente após liberação final — filtrado no SELECT ou RLS)
CREATE OR REPLACE VIEW public.resultado_publico AS
SELECT
  p.nome_projeto,
  p.nome_responsavel,
  p.municipio,
  r.status_final::text AS status_final
FROM public.resultados r
JOIN public.projetos p ON p.id = r.projeto_id
WHERE r.status_final IN ('SELECIONADO'::public.resultado_status_final, 'SUPLENTE'::public.resultado_status_final);

-- ========== TRIGGER: nota ponderada ==========
CREATE OR REPLACE FUNCTION public.trg_avaliacoes_ponderada()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nota_total_ponderada :=
    (NEW.nota_equipe * 6) + (NEW.nota_mercado * 6) + (NEW.nota_produto * 4) + (NEW.nota_tecnologia * 4);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS avaliacoes_ponderada ON public.avaliacoes;
CREATE TRIGGER avaliacoes_ponderada
  BEFORE INSERT OR UPDATE OF nota_equipe, nota_mercado, nota_produto, nota_tecnologia
  ON public.avaliacoes
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_avaliacoes_ponderada();

-- ========== TRIGGER: novo usuário → profile ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nome)
  VALUES (
    NEW.id,
    'AVALIADOR'::public.profile_role,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ========== RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios_sertao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_coordenador());
CREATE POLICY profiles_update_coord ON public.profiles FOR UPDATE
  USING (public.is_coordenador());
CREATE POLICY profiles_insert_coord ON public.profiles FOR INSERT
  WITH CHECK (public.is_coordenador());

-- municipios_sertao
CREATE POLICY municipios_all_coord ON public.municipios_sertao FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY municipios_select_avaliador ON public.municipios_sertao FOR SELECT
  USING (public.get_avaliador_id_for_auth() IS NOT NULL OR public.is_coordenador());

-- avaliadores
CREATE POLICY avaliadores_all_coord ON public.avaliadores FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY avaliadores_select_self ON public.avaliadores FOR SELECT
  USING (id = public.get_avaliador_id_for_auth());

-- projetos: coordenador tudo; avaliador só projetos atribuídos
CREATE POLICY projetos_all_coord ON public.projetos FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY projetos_select_avaliador ON public.projetos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes a
      WHERE a.projeto_id = projetos.id AND a.avaliador_id = public.get_avaliador_id_for_auth()
    )
  );

-- impedimentos
CREATE POLICY impedimentos_all_coord ON public.impedimentos FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY impedimentos_insert_avaliador ON public.impedimentos FOR INSERT
  WITH CHECK (avaliador_id = public.get_avaliador_id_for_auth());
CREATE POLICY impedimentos_select_avaliador ON public.impedimentos FOR SELECT
  USING (avaliador_id = public.get_avaliador_id_for_auth());

-- atribuicoes
CREATE POLICY atribuicoes_all_coord ON public.atribuicoes FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY atribuicoes_select_avaliador ON public.atribuicoes FOR SELECT
  USING (avaliador_id = public.get_avaliador_id_for_auth());
CREATE POLICY atribuicoes_update_avaliador ON public.atribuicoes FOR UPDATE
  USING (avaliador_id = public.get_avaliador_id_for_auth());

-- avaliacoes: avaliador insert só sua atribuição; sem update para avaliador
CREATE POLICY avaliacoes_all_coord ON public.avaliacoes FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY avaliacoes_select_avaliador_own ON public.avaliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      WHERE att.id = avaliacoes.atribuicao_id AND att.avaliador_id = public.get_avaliador_id_for_auth()
    )
  );
CREATE POLICY avaliacoes_insert_avaliador ON public.avaliacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atribuicoes att
      WHERE att.id = avaliacoes.atribuicao_id
        AND att.avaliador_id = public.get_avaliador_id_for_auth()
        AND att.status IN ('PENDENTE'::public.atribuicao_status, 'EM_ANDAMENTO'::public.atribuicao_status)
    )
  );

-- resultados: coordenador all; avaliador não vê resultados globais (evita ver notas de outros)
CREATE POLICY resultados_all_coord ON public.resultados FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());

-- recursos
CREATE POLICY recursos_all_coord ON public.recursos FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());

-- logs
CREATE POLICY logs_all_coord ON public.logs_auditoria FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());

-- app_config
CREATE POLICY config_all_coord ON public.app_config FOR ALL
  USING (public.is_coordenador()) WITH CHECK (public.is_coordenador());
CREATE POLICY app_config_select_anon ON public.app_config FOR SELECT
  TO anon
  USING (id = 1);

-- Página pública: políticas apenas para role anon (evita vazamento para avaliador autenticado)
DROP POLICY IF EXISTS resultados_select_public_anon ON public.resultados;
DROP POLICY IF EXISTS projetos_select_public_anon ON public.projetos;

CREATE POLICY resultados_select_public_anon ON public.resultados FOR SELECT
  TO anon
  USING (
    EXISTS (SELECT 1 FROM public.app_config c WHERE c.id = 1 AND c.resultado_final_liberado = true)
    AND status_final IN ('SELECIONADO'::public.resultado_status_final, 'SUPLENTE'::public.resultado_status_final)
  );

CREATE POLICY projetos_select_public_anon ON public.projetos FOR SELECT
  TO anon
  USING (
    EXISTS (SELECT 1 FROM public.app_config c WHERE c.id = 1 AND c.resultado_final_liberado = true)
    AND id IN (
      SELECT projeto_id FROM public.resultados
      WHERE status_final IN ('SELECIONADO'::public.resultado_status_final, 'SUPLENTE'::public.resultado_status_final)
    )
  );

-- Authenticated coordenador já tem projetos_all_coord; avaliador tem projetos_select_avaliador.

COMMENT ON TABLE public.projetos IS 'Projetos inscritos — Edital 45/2026';
