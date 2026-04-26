export type ManualPerfil = "admin" | "avaliador";

export type ManualSecao = {
  titulo: string;
  descricao: string;
  passos: string[];
};

export type ManualConteudo = {
  perfil: ManualPerfil;
  titulo: string;
  subtitulo: string;
  secoes: ManualSecao[];
};

export const MANUAIS: Record<ManualPerfil, ManualConteudo> = {
  admin: {
    perfil: "admin",
    titulo: "Guia de uso do Coordenador (Admin)",
    subtitulo: "Guia completo para configuração do programa, operação de avaliações e fechamento de resultados.",
    secoes: [
      {
        titulo: "1) Acesso ao painel",
        descricao: "Como entrar no ambiente administrativo com segurança.",
        passos: [
          "Acesse a tela inicial e clique em Painel de coordenação.",
          "Entre com magic link ou senha.",
          "Confirme que o menu lateral com Monitoramento, Projetos e Atribuições está visível.",
        ],
      },
      {
        titulo: "2) Configuração do programa",
        descricao: "Defina parâmetros que impactam todas as avaliações.",
        passos: [
          "Abra Programa e configure nome do edital, datas de início/fim e número de avaliadores por projeto.",
          "Quando necessário, aplique a prorrogação única do prazo.",
          "Salve e valide se as datas estão corretas antes de iniciar atribuições.",
        ],
      },
      {
        titulo: "3) Gestão de avaliadores",
        descricao: "Cadastro, aprovação e manutenção de avaliadores.",
        passos: [
          "Em Avaliadores, aprove ou recuse cadastros pendentes.",
          "Adicione avaliadores manualmente ou por importação CSV.",
          "Ative/desative perfis conforme disponibilidade e carga.",
        ],
      },
      {
        titulo: "4) Projetos e triagem",
        descricao: "Conferência das inscrições e classificação inicial.",
        passos: [
          "Use Projetos para filtrar por município, fase e status.",
          "Abra detalhes para validar dados de responsável e vídeo.",
          "Desclassifique ou reclassifique quando houver justificativa.",
        ],
      },
      {
        titulo: "5) Atribuições de avaliação",
        descricao: "Distribuição manual, automática e atribuições adicionais.",
        passos: [
          "No modo Manual, selecione projeto e avaliadores distintos.",
          "No modo Automático, distribua em lote respeitando impedimentos.",
          "Use Adicionar avaliador ao projeto quando precisar reforçar a análise.",
        ],
      },
      {
        titulo: "6) Ranking e cota",
        descricao: "Geração de resultados e aplicação de critérios de seleção.",
        passos: [
          "Em Ranking, atualize total de vagas quando necessário.",
          "Gere o ranking consolidado após as avaliações.",
          "Aplique a cota Sertão e confira os selecionados.",
        ],
      },
      {
        titulo: "7) Recursos e auditoria",
        descricao: "Tratamento de recursos e rastreabilidade das decisões.",
        passos: [
          "Registre cada recurso com descrição e parecer.",
          "Quando deferido, ajuste nota e recalcule o ranking.",
          "Mantenha histórico consistente para transparência do edital.",
        ],
      },
      {
        titulo: "8) Relatórios e comunicação",
        descricao: "Geração de documentos e envio de lembretes.",
        passos: [
          "Exporte relatórios PDF e planilhas para acompanhamento.",
          "Use lembretes por e-mail para avaliadores com pendências.",
          "Compartilhe apenas versões oficiais dos resultados.",
        ],
      },
    ],
  },
  avaliador: {
    perfil: "avaliador",
    titulo: "Guia de uso do Avaliador",
    subtitulo: "Passo a passo para acessar projetos, avaliar com qualidade e registrar impedimentos.",
    secoes: [
      {
        titulo: "1) Primeiro acesso",
        descricao: "Como entrar corretamente na área do avaliador.",
        passos: [
          "Na tela inicial, clique em Área do avaliador.",
          "Entre por magic link ou senha cadastrada.",
          "Se o cadastro ainda não foi aprovado, aguarde liberação da coordenação.",
        ],
      },
      {
        titulo: "2) Lista de projetos",
        descricao: "Entenda os filtros e organize sua rotina de avaliação.",
        passos: [
          "Use os filtros Pendentes, Já avaliados e Todos.",
          "Priorize projetos com status de atribuição pendente.",
          "Abra cada projeto pelo botão Abrir.",
        ],
      },
      {
        titulo: "3) Leitura do projeto",
        descricao: "Analise contexto antes de preencher notas.",
        passos: [
          "Revise dados do responsável, município, fase e categoria.",
          "Assista ao vídeo pitch quando disponível.",
          "Garanta avaliação objetiva com base nos critérios oficiais.",
        ],
      },
      {
        titulo: "4) Preenchimento da avaliação",
        descricao: "Como pontuar e justificar de forma consistente.",
        passos: [
          "Atribua notas para Equipe, Mercado, Produto e Tecnologia.",
          "Preencha justificativa geral com clareza e foco técnico.",
          "Confira a nota ponderada exibida em tempo real antes de enviar.",
        ],
      },
      {
        titulo: "5) Impedimento ou impossibilidade de avaliar",
        descricao: "Procedimento correto quando não for possível concluir.",
        passos: [
          "Use o botão Não conseguirei avaliar.",
          "Selecione o tipo de impedimento e descreva a justificativa.",
          "Após confirmar, a coordenação poderá atribuir outro avaliador.",
        ],
      },
      {
        titulo: "6) Boas práticas",
        descricao: "Regras essenciais para manter qualidade e ética.",
        passos: [
          "Não compartilhe notas ou pareceres fora da plataforma.",
          "Evite linguagem subjetiva ou sem fundamento técnico.",
          "Cumpra os prazos para não prejudicar o cronograma do edital.",
        ],
      },
    ],
  },
};
