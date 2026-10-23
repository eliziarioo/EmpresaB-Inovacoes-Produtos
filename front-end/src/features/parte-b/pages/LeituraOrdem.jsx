
import { useEffect, useState } from "react";
import {
  buscarOrdem,
  analisarOrdem
} from "../services/gestorService";

import "../parteB.css";

export default function LeituraOrdem({ onAnaliseConcluida }) {
  const [ordem, setOrdem] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarOrdem();
        setOrdem(dados);
        setDescricao(dados.descricao);
      } catch {
        setErro("Não foi possível carregar a ordem.");
      }
    }

    carregar();
  }, []);

  async function handleAnalisar() {
    setErro("");
    setCarregando(true);

    try {
    const dados = await analisarOrdem(descricao);
    onAnaliseConcluida(ordem, dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  if (!ordem) {
    return (
      <main className="gestor-container">
        <p>{erro || "Carregando ordem..."}</p>
      </main>
    );
  }

  return (
    <main className="gestor-container">
      <div className="gestor-topo">
        <span className="gestor-etiqueta">
          ORDEM DE SERVIÇO
        </span>
        <h1>Leitura da ordem</h1>
        <p>
          Confira as informações antes de solicitar
          a recomendação de equipe.
        </p>
      </div>

      <section className="gestor-card">
        <div className="gestor-card-topo">
          <h2>{ordem.id}</h2>
          <span className="gestor-status">
            {ordem.status}
          </span>
        </div>

        <h3>{ordem.titulo}</h3>

        <div className="gestor-informacoes">
          <p><strong>Local:</strong> {ordem.local}</p>
          <p>
            <strong>Ambiente:</strong> {ordem.ambiente}
          </p>
          <p><strong>Prazo:</strong> {ordem.prazo}</p>
        </div>

        <label htmlFor="descricao-os">
          Descrição da ordem de serviço
        </label>

        <textarea
          id="descricao-os"
          value={descricao}
          onChange={(event) =>
            setDescricao(event.target.value)
          }
          rows={7}
        />

        {erro && (
          <p className="gestor-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="gestor-acoes">
          <button
            type="button"
            className="gestor-botao"
            onClick={handleAnalisar}
            disabled={carregando || !descricao.trim()}
          >
            {carregando
              ? "Analisando..."
              : "Analisar ordem"}
          </button>
        </div>
      </section>
    </main>
  );
}
