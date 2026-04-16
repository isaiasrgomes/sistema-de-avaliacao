-- Evita perda de dados na importação e no cadastro manual.
-- Telefone e CNPJ passam a aceitar vazio em vez de null, e
-- município/categoria_setor deixam de estourar em varchar(100).

-- A view depende de projetos.municipio; precisamos recriá-la após alterar o tipo.
DROP VIEW IF EXISTS public.resultado_publico;

UPDATE public.projetos
SET telefone = ''
WHERE telefone IS NULL;

UPDATE public.projetos
SET cnpj = ''
WHERE cnpj IS NULL;

ALTER TABLE public.projetos
  ALTER COLUMN telefone TYPE text USING COALESCE(telefone, ''),
  ALTER COLUMN telefone SET DEFAULT '',
  ALTER COLUMN telefone SET NOT NULL,
  ALTER COLUMN cnpj TYPE text USING COALESCE(cnpj, ''),
  ALTER COLUMN cnpj SET DEFAULT '',
  ALTER COLUMN cnpj SET NOT NULL,
  ALTER COLUMN municipio TYPE text,
  ALTER COLUMN categoria_setor TYPE text;

CREATE OR REPLACE VIEW public.resultado_publico AS
SELECT
  p.nome_projeto,
  p.nome_responsavel,
  p.municipio,
  r.status_final::text AS status_final
FROM public.resultados r
JOIN public.projetos p ON p.id = r.projeto_id
WHERE r.status_final IN ('SELECIONADO'::public.resultado_status_final, 'SUPLENTE'::public.resultado_status_final);
