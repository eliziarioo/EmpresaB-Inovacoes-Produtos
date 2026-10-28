
import { chamarApi } from "../../../services/api.js";
import {
  ordemMock,
  equipeMock,
  justificativaMock
} from "../mocks/gestorMock";

export async function buscarOrdem() {
  return { ...ordemMock };
}

export async function analisarOrdem(descricao) {
  if (!descricao.trim()) {
    throw new Error("A descrição não pode estar vazia.");
  }

  return {
    equipe: equipeMock,
    justificativa: justificativaMock
  };
}

export async function aprovarEquipe(ordemId) {
  if (!ordemId) {
    throw new Error("Ordem não identificada.");
  }

  await chamarApi(`/ordens/${ordemId}/equipe/aprovar`, {
    metodo: "POST",
    corpo: {}
  });

  return {
    sucesso: true,
    mensagem: "Equipe aprovada com sucesso!"
  };
}
