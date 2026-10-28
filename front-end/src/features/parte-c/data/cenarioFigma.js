import soldaPdf from "../mocks/documentos/PR-SOL-014.pdf?url";
import manualPdf from "../mocks/documentos/manual-vaso-V-301.pdf?url";
import aprPdf from "../mocks/documentos/APR-trabalho-em-altura.pdf?url";

// Dados do protótipo fornecido. Nunca são misturados às respostas do modo API.
export const perfilFigma = {
  id: "tecnico",
  tipo: "tecnico",
  profissional_id: "pro-003",
  nome: "Paulo Souza",
  primeiro_nome: "Paulo",
  iniciais: "PS",
  cargo: "Caldeireiro",
  matricula: "AB-123456",
  base: "Macaé (RJ)",
  escala: "14 x 14 · embarca 17/10",
  supervisor: "Marina Costa",
  certificacoes: [
    { codigo: "CBSP", validade: "2027-11-30" },
    { codigo: "HUET", validade: "2027-11-30" },
    { codigo: "NR-35", validade: "2027-02-28" },
  ],
};
export const documentosFigma = [
  {
    id: "doc-001",
    codigo: "PR-SOL-014",
    versao: "3",
    versao_rotulo: "v3",
    titulo: "Reparo por solda em vasos de pressão",
    titulo_inicio: "PR-SOL-014 · Reparo por solda em vasos",
    descricao_curta: "Versão 3 · aprovado em 08/2026",
    aprovado_em: "12/08/2026",
    url: soldaPdf,
  },
  {
    id: "doc-003",
    codigo: "APR-ALT-005",
    versao: "5",
    versao_rotulo: "v5",
    titulo: "APR · trabalho em altura",
    titulo_inicio: "APR · trabalho em altura",
    descricao_curta: "Modelo da empresa · versão 5",
    aprovado_em: "20/09/2026",
    url: aprPdf,
  },
  {
    id: "doc-ele",
    codigo: "PR-ELE-008",
    versao: "4",
    versao_rotulo: "v4",
    titulo: "Bloqueio e etiquetagem elétrica",
    aprovado_em: "02/07/2026",
    url: null,
  },
  {
    id: "doc-002",
    codigo: "MAN-V301",
    versao: "revisão 2",
    versao_rotulo: "rev. 2",
    titulo: "Manual do vaso V-301",
    titulo_inicio: "Manual do vaso V-301",
    descricao_curta: "Fabricante · revisão 2",
    aprovado_em: "03/05/2026",
    url: manualPdf,
  },
];
export const servicosFigma = [
  {
    ordem_id: "OS-2481",
    titulo: "Reparo com solda no vaso V-301",
    estado: "equipe_aprovada",
    selo: "Amanhã · embarque 06:30",
    local: "Plataforma P-XX · offshore",
    data_funcao: "17 e 18/10 · abertura e fechamento do bocal",
    local_detalhe: "Plataforma P-XX · módulo 3",
    prazo_texto: "18/10 · 48 horas após o embarque",
    equipe_texto: "Carlos Mendes, Ana Ribeiro e você",
    sua_funcao: "abertura e fechamento do bocal, em altura (NR-35)",
    equipamento: "Vaso V-301",
    documentos_ids: ["doc-001", "doc-002", "doc-003"],
    avisos: [
      {
        tipo: "confirmado",
        mensagem: "Embarque confirmado · amanhã, 17/10, às 06:30",
      },
      {
        tipo: "atencao",
        mensagem:
          "Atenção · o serviço só começa com a permissão de trabalho emitida a bordo.",
      },
    ],
  },
  {
    ordem_id: "OS-2499",
    titulo: "Inspeção de linha de vapor",
    estado: "agendado",
    selo: "Agendado",
    local: "Base Macaé · onshore",
    data_funcao: "24/10 · apoio à inspeção",
    prazo_texto: "24/10",
    documentos_ids: [],
    avisos: [],
  },
  {
    ordem_id: "OS-2506",
    titulo: "Troca de juntas em trocador de calor",
    estado: "agendado",
    selo: "Agendado",
    local: "Plataforma P-YY · offshore",
    data_funcao: "03/11 · caldeiraria",
    prazo_texto: "03/11",
    documentos_ids: [],
    avisos: [],
  },
  {
    ordem_id: "OS-2465",
    titulo: "Abertura de vaso para inspeção",
    estado: "concluida",
    selo: "Concluído",
    local: "Plataforma P-XX · offshore",
    data_funcao: "08/10 · caldeiraria",
    documentos_ids: [],
    avisos: [],
  },
  {
    ordem_id: "OS-2458",
    titulo: "Fechamento de flange em linha de óleo",
    estado: "concluida",
    selo: "Concluído",
    local: "Base Macaé · onshore",
    data_funcao: "30/09 · caldeiraria",
    documentos_ids: [],
    avisos: [],
  },
];
export const perguntaInicial =
  "O que preciso confirmar antes de começar a solda no V-301?";
export const sugestoesFigma = [
  "Qual a pressão de teste do V-301 depois do reparo?",
  "Quais EPIs a APR de altura exige?",
];
export const respostaInicial = {
  tipo: "resposta",
  resposta: "Segundo o procedimento de reparo por solda, antes de iniciar:",
  passos: [
    "Permissão de trabalho emitida e assinada a bordo.",
    "Vaso despressurizado, drenado e isolado, com bloqueio e etiquetagem.",
    "Liberação de trabalho a quente pela segurança da plataforma.",
    "Início registrado no aplicativo.",
  ],
  citacao: {
    documento_id: "doc-001",
    codigo: "PR-SOL-014",
    versao: "3",
    secao: "4.2",
    pagina: 7,
    trecho:
      "Nenhuma atividade de solda deve ser iniciada sem a permissão de trabalho válida e o isolamento do equipamento…",
  },
};
