-- Seed rápido: adiciona 10 projetos de exemplo sem apagar dados existentes.
-- Execute no SQL Editor do Supabase.

INSERT INTO public.projetos (
  nome_projeto,
  nome_responsavel,
  email_responsavel,
  telefone,
  cpf_responsavel,
  cnpj,
  municipio,
  uf,
  fase,
  categoria_setor,
  is_sertao,
  url_video_pitch,
  timestamp_submissao,
  status
)
SELECT
  v.nome_projeto,
  v.nome_responsavel,
  v.email_responsavel,
  v.telefone,
  v.cpf_responsavel,
  v.cnpj,
  v.municipio,
  v.uf,
  v.fase::public.projeto_fase,
  v.categoria_setor,
  EXISTS (
    SELECT 1
    FROM public.municipios_sertao ms
    WHERE lower(trim(ms.municipio)) = lower(trim(v.municipio))
  ) AS is_sertao,
  v.url_video_pitch,
  v.timestamp_submissao::timestamptz,
  'INSCRITO'::public.projeto_status
FROM (
  VALUES
    ('AgroSens IA', 'Marina Lima', 'marina.lima.demo1@example.com', '(81) 99876-1234', '12345678901', NULL, 'Petrolina', 'PE', 'IDEACAO', 'Agrotech', 'https://example.com/pitch/agrosens', now() - interval '10 days'),
    ('Saude Conecta', 'Rafael Souza', 'rafael.souza.demo2@example.com', '(11) 98765-4321', '23456789012', NULL, 'Sao Paulo', 'SP', 'VALIDACAO', 'HealthTech', 'https://example.com/pitch/saudeconecta', now() - interval '9 days'),
    ('Educa Trilhas', 'Ana Beatriz', 'ana.beatriz.demo3@example.com', '(85) 99654-3321', '34567890123', NULL, 'Fortaleza', 'CE', 'IDEACAO', 'EdTech', 'https://example.com/pitch/educatrilhas', now() - interval '8 days'),
    ('LogiVerde', 'Carlos Mendes', 'carlos.mendes.demo4@example.com', '(31) 99771-2244', '45678901234', '12.345.678/0001-90', 'Belo Horizonte', 'MG', 'VALIDACAO', 'Logistica', 'https://example.com/pitch/logiverde', now() - interval '7 days'),
    ('Energia de Bairro', 'Joao Victor', 'joao.victor.demo5@example.com', '(27) 99821-7788', '56789012345', NULL, 'Vitoria', 'ES', 'IDEACAO', 'Energia', 'https://example.com/pitch/energiadebairro', now() - interval '6 days'),
    ('Justica Facil', 'Patricia Nunes', 'patricia.nunes.demo6@example.com', '(21) 99911-6655', '67890123456', NULL, 'Rio de Janeiro', 'RJ', 'VALIDACAO', 'LegalTech', 'https://example.com/pitch/justicafacil', now() - interval '5 days'),
    ('Turismo Vivo', 'Bruno Araujo', 'bruno.araujo.demo7@example.com', '(62) 99444-5566', '78901234567', NULL, 'Goiania', 'GO', 'IDEACAO', 'Turismo', 'https://example.com/pitch/turismovivo', now() - interval '4 days'),
    ('Financas Simples', 'Larissa Costa', 'larissa.costa.demo8@example.com', '(41) 99222-3344', '89012345678', NULL, 'Curitiba', 'PR', 'VALIDACAO', 'FinTech', 'https://example.com/pitch/financassimples', now() - interval '3 days'),
    ('Recicla Cidade', 'Diego Alves', 'diego.alves.demo9@example.com', '(71) 99333-4455', '90123456789', '45.987.321/0001-10', 'Salvador', 'BA', 'IDEACAO', 'Sustentabilidade', 'https://example.com/pitch/reciclacidade', now() - interval '2 days'),
    ('Conecta Campo', 'Juliana Melo', 'juliana.melo.demo10@example.com', '(83) 99123-7788', '01234567890', NULL, 'Campina Grande', 'PB', 'VALIDACAO', 'Agrotech', 'https://example.com/pitch/conectacampo', now() - interval '1 day')
) AS v(
  nome_projeto,
  nome_responsavel,
  email_responsavel,
  telefone,
  cpf_responsavel,
  cnpj,
  municipio,
  uf,
  fase,
  categoria_setor,
  url_video_pitch,
  timestamp_submissao
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.projetos p
  WHERE p.cpf_responsavel = v.cpf_responsavel
    AND p.nome_projeto = v.nome_projeto
);
