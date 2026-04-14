-- Seed: adiciona 10 projetos já avaliados e cria resultados correspondentes.
-- Não remove dados existentes.
-- Execute no SQL Editor do Supabase.

WITH base AS (
  SELECT *
  FROM (
    VALUES
      ('Aqua Monitor', 'Helena Prado', 'helena.prado.av1@example.com', '(81) 99111-1001', '10101010101', NULL, 'Petrolina', 'PE', 'IDEACAO', 'Agrotech', 'https://example.com/pitch/aquamonitor', now() - interval '20 days', 86.40, 4.4, 4.3, 4.2, 4.4, 'SELECIONADO', true),
      ('Clinica Mobile', 'Vinicius Rocha', 'vinicius.rocha.av2@example.com', '(11) 99222-1002', '20202020202', NULL, 'Sao Paulo', 'SP', 'VALIDACAO', 'HealthTech', 'https://example.com/pitch/clinicamobile', now() - interval '19 days', 79.25, 4.0, 3.9, 4.0, 3.9, 'SUPLENTE', false),
      ('Educa IA', 'Paula Batista', 'paula.batista.av3@example.com', '(85) 99333-1003', '30303030303', NULL, 'Fortaleza', 'CE', 'IDEACAO', 'EdTech', 'https://example.com/pitch/educaia', now() - interval '18 days', 74.60, 3.8, 3.7, 3.8, 3.8, 'NAO_SELECIONADO', false),
      ('Rota Verde', 'Guilherme Lima', 'guilherme.lima.av4@example.com', '(31) 99444-1004', '40404040404', '32.111.222/0001-44', 'Belo Horizonte', 'MG', 'VALIDACAO', 'Logistica', 'https://example.com/pitch/rotaverde', now() - interval '17 days', 84.10, 4.2, 4.2, 4.1, 4.2, 'SELECIONADO', false),
      ('Rede Solar Popular', 'Marcos Vieira', 'marcos.vieira.av5@example.com', '(27) 99555-1005', '50505050505', NULL, 'Vitoria', 'ES', 'IDEACAO', 'Energia', 'https://example.com/pitch/redesolar', now() - interval '16 days', 77.00, 3.9, 3.8, 3.8, 3.9, 'SUPLENTE', false),
      ('Documento Facil', 'Renata Alves', 'renata.alves.av6@example.com', '(21) 99666-1006', '60606060606', NULL, 'Rio de Janeiro', 'RJ', 'VALIDACAO', 'LegalTech', 'https://example.com/pitch/documentofacil', now() - interval '15 days', 72.30, 3.6, 3.7, 3.6, 3.7, 'NAO_SELECIONADO', false),
      ('Tur Smart', 'Andre Nogueira', 'andre.nogueira.av7@example.com', '(62) 99777-1007', '70707070707', NULL, 'Goiania', 'GO', 'IDEACAO', 'Turismo', 'https://example.com/pitch/tursmart', now() - interval '14 days', 80.50, 4.1, 4.0, 4.0, 4.0, 'SUPLENTE', false),
      ('Conta Certa', 'Aline Costa', 'aline.costa.av8@example.com', '(41) 99888-1008', '80808080808', NULL, 'Curitiba', 'PR', 'VALIDACAO', 'FinTech', 'https://example.com/pitch/contacerta', now() - interval '13 days', 88.15, 4.5, 4.4, 4.4, 4.5, 'SELECIONADO', false),
      ('Circular Reuso', 'Tiago Menezes', 'tiago.menezes.av9@example.com', '(71) 99999-1009', '90909090909', '98.765.432/0001-11', 'Salvador', 'BA', 'IDEACAO', 'Sustentabilidade', 'https://example.com/pitch/circularreuso', now() - interval '12 days', 76.80, 3.9, 3.8, 3.8, 3.7, 'SUPLENTE', false),
      ('Agro Link', 'Camila Farias', 'camila.farias.av10@example.com', '(83) 99100-1010', '01010101010', NULL, 'Campina Grande', 'PB', 'VALIDACAO', 'Agrotech', 'https://example.com/pitch/agrolink', now() - interval '11 days', 70.95, 3.5, 3.6, 3.5, 3.6, 'NAO_SELECIONADO', false)
  ) AS t(
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
    timestamp_submissao,
    nota_final,
    media_equipe,
    media_mercado,
    media_produto,
    media_tecnologia,
    status_final,
    enquadramento_cota
  )
),
insere_projetos AS (
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
    b.nome_projeto,
    b.nome_responsavel,
    b.email_responsavel,
    b.telefone,
    b.cpf_responsavel,
    b.cnpj,
    b.municipio,
    b.uf,
    b.fase::public.projeto_fase,
    b.categoria_setor,
    EXISTS (
      SELECT 1
      FROM public.municipios_sertao ms
      WHERE lower(trim(ms.municipio)) = lower(trim(b.municipio))
    ) AS is_sertao,
    b.url_video_pitch,
    b.timestamp_submissao::timestamptz,
    'AVALIADO'::public.projeto_status
  FROM base b
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.projetos p
    WHERE p.cpf_responsavel = b.cpf_responsavel
      AND p.nome_projeto = b.nome_projeto
  )
  RETURNING id, cpf_responsavel, nome_projeto
)
INSERT INTO public.resultados (
  projeto_id,
  nota_final,
  media_equipe,
  media_mercado,
  media_produto,
  media_tecnologia,
  posicao_geral,
  posicao_sertao,
  status_final,
  enquadramento_cota
)
SELECT
  p.id,
  b.nota_final,
  b.media_equipe,
  b.media_mercado,
  b.media_produto,
  b.media_tecnologia,
  NULL,
  NULL,
  b.status_final::public.resultado_status_final,
  b.enquadramento_cota
FROM base b
JOIN public.projetos p
  ON p.cpf_responsavel = b.cpf_responsavel
 AND p.nome_projeto = b.nome_projeto
WHERE NOT EXISTS (
  SELECT 1
  FROM public.resultados r
  WHERE r.projeto_id = p.id
);
