// Dados fictícios para simular a resposta da API do gestor de ordens de serviço
export const ordemMock = {
  id: "OS-2481",
  titulo: "Reparo com solda em vaso de pressão V-301",
  local: "Plataforma P-XX",
  ambiente: "Offshore",
  prazo: "x/y/2026",
  status: "Aguardando análise",
  descricao:
    "Realizar reparo com solda no vaso de pressão V-301. " +
    "A atividade exige profissionais qualificados, " +
    "com certificações adequadas e experiência " +
    "em manutenção industrial."
};

export const equipeMock = [
  {
    id: 1,
    nome: "Carlos Oliveira",
    cargo: "Soldador industrial",
    certificacoes: ["NR-35", "Qualificação em soldagem"],
    disponivel: true
  },
  {
    id: 2,
    nome: "Ana Ferreira",
    cargo: "Técnica de segurança",
    certificacoes: ["NR-33", "NR-35"],
    disponivel: true
  },
  {
    id: 3,
    nome: "Roberto Santos",
    cargo: "Inspetor de soldagem",
    certificacoes: ["Inspeção de soldagem"],
    disponivel: true
  }
];

export const justificativaMock =
  "Equipe sugerida com base nas qualificações, " +
  "certificações e disponibilidade dos profissionais.";
