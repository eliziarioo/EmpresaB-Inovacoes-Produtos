import {
  perfilFigma,
  servicosFigma,
  documentosFigma,
  perguntaInicial,
  respostaInicial,
  sugestoesFigma,
} from "../data/cenarioFigma.js";
import respostas from "../data/chatRespostas.json";
import trechos from "../data/trechosDocumentos.json";
import { guardar } from "./armazenamentoService.js";

const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const modoPadrao = import.meta.env.VITE_TECNICO_MODO || "demo";
const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function criarServico(modo = modoPadrao) {
  const demo = modo === "demo";
  async function requisitar(
    caminho,
    { metodo = "GET", corpo, blob = false } = {},
  ) {
    const token =
      localStorage.getItem("it_token") || sessionStorage.getItem("it_token");
    let r;
    try {
      r = await fetch(base + caminho, {
        method: metodo,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(corpo ? { "Content-Type": "application/json" } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        "Não foi possível conectar à API. Verifique a conexão e tente novamente.",
      );
    }
    if (!r.ok) {
      const erro = await r.json().catch(() => ({}));
      const e = new Error(
        erro.detail || `Não foi possível concluir a solicitação (${r.status}).`,
      );
      e.status = r.status;
      throw e;
    }
    return blob ? r.blob() : r.json();
  }
  return {
    modo,
    async entrar(email, senha) {
      if (demo) {
        if (
          email.toLowerCase() !== "joao123@empresa.com.br" ||
          senha !== "demo2026"
        )
          throw new Error("E-mail ou senha incorretos.");
        return { ...perfilFigma };
      }
      const usuario = email.trim().split("@")[0].split(".")[0].toLowerCase();
      const r = await requisitar("/entrar", {
        metodo: "POST",
        corpo: { usuario, senha },
      });
      if (r.perfil.tipo !== "tecnico")
        throw new Error("Entre com uma conta de técnico.");
      localStorage.setItem("it_token", r.token);
      return r.perfil;
    },
    async sair() {
      if (!demo) await requisitar("/sair", { metodo: "POST" }).catch(() => {});
      localStorage.removeItem("it_token");
      sessionStorage.removeItem("it_token");
    },
    async carregar() {
      if (demo)
        return {
          perfil: { ...perfilFigma },
          servicos: structuredClone(servicosFigma),
          documentos: structuredClone(documentosFigma),
          data_texto: "Sexta, 16 de outubro",
        };
      // Extensão complementar: perfil próprio, concluídos e documentos autorizados.
      return requisitar("/tecnico/contexto");
    },
    async perguntar(ordem, pergunta) {
      if (!demo)
        return requisitar("/tecnico/chat", {
          metodo: "POST",
          corpo: { ordem_id: ordem.ordem_id, pergunta },
        });
      if (pergunta === perguntaInicial) return structuredClone(respostaInicial);
      const texto = normalizar(pergunta);
      if (texto.includes("pressao"))
        return {
          tipo: "nao_encontrada",
          resposta:
            "Os documentos autorizados para esta OS não trazem a pressão de teste do V-301. Não use valores de outros equipamentos.",
          complemento:
            "Quem define o teste é o engenheiro responsável pela inspeção.",
          escalar_para: {
            nome: "Carlos Mendes",
            rotulo: "Falar com Carlos Mendes",
          },
        };
      const r = respostas.respostas.find((x) =>
        x.palavras_chave.some((p) => texto.includes(p)),
      );
      if (
        r?.tipo === "resposta" &&
        ordem.documentos_ids.includes(r.citacao.documento_id)
      ) {
        const doc = documentosFigma.find(
          (d) => d.id === r.citacao.documento_id,
        );
        return {
          ...r,
          citacao: { ...r.citacao, codigo: doc.codigo, versao: doc.versao },
        };
      }
      return {
        tipo: "nao_encontrada",
        resposta:
          "Essa informação não consta nos documentos autorizados desta ordem.",
        complemento: "Confirme com o responsável antes de seguir.",
        escalar_para: {
          nome: "Carlos Mendes",
          rotulo: "Falar com Carlos Mendes",
        },
      };
    },
    async sugestoes() {
      return demo
        ? sugestoesFigma
        : (await requisitar("/chat/sugestoes")).sugestoes;
    },
    async abrirArquivo(doc) {
      if (!demo)
        return requisitar(
          `/tecnico/documentos/${encodeURIComponent(doc.id)}/arquivo`,
          { blob: true },
        );
      if (!doc.url)
        throw new Error(
          "Este documento ainda não está disponível. Solicite o arquivo ao administrador.",
        );
      const r = await fetch(doc.url);
      if (!r.ok) throw new Error("Documento indisponível.");
      return r.blob();
    },
    async pacote(ordem) {
      if (!demo)
        return requisitar(
          `/tecnico/ordens/${encodeURIComponent(ordem.ordem_id)}/pacote`,
        );
      const documentos = documentosFigma.filter((d) =>
        ordem.documentos_ids.includes(d.id),
      );
      return {
        ordem,
        documentos,
        trechos: trechos.filter((t) =>
          ordem.documentos_ids.includes(t.documento_id),
        ),
      };
    },
    async sincronizar(eventos) {
      if (!demo)
        return requisitar("/tecnico/sincronizar", {
          metodo: "POST",
          corpo: { eventos },
        });
      // O modo demonstrativo tem um recibo local; não declara envio para servidor.
      for (const e of eventos) await guardar(`recibo-demo:${e.id}`, e);
      return {
        confirmados: eventos.map((e) => e.id),
        destino: "demonstracao-local",
      };
    },
  };
}
