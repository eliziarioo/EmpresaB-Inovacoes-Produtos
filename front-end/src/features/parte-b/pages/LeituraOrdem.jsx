
import { useEffect, useRef, useState } from "react";
import {
  buscarOrdem,
  analisarOrdem
} from "../services/gestorService";

import "../parteB.css";

// Dados demonstrativos retirados da Tela 2 do Figma.
// Ainda não representam uma resposta real de IA.
const descricaoPrototipo =
  "Vazamento identificado no vaso de pressão V-301, " +
  "módulo 3 da plataforma P-XX. Necessário reparo com " +
  "solda no bocal de saída e inspeção após o reparo. " +
  "Acesso pelo andaime a 6 metros. Prazo de 48 horas " +
  "a partir do embarque.";

const informacoesPrototipo = [
  {
    titulo: "AMBIENTE",
    valor: "Offshore",
    origem: "“plataforma P-XX”"
  },
  {
    titulo: "EQUIPAMENTO",
    valor: "Vaso de pressão V-301",
    origem: "“vaso de pressão V-301”"
  },
  {
    titulo: "ATIVIDADES",
    valor: "Reparo com solda · inspeção",
    origem: "“reparo com solda… e inspeção”"
  },
  {
    titulo: "CONDIÇÃO DE ACESSO",
    valor: "Trabalho em altura",
    origem: "“andaime a 6 metros”"
  },
  {
    titulo: "PRAZO",
    valor: "48 horas após o embarque",
    origem: "Limite: 18/10/2026"
  },
  {
    titulo: "EQUIPE ESTIMADA",
    valor: "3 profissionais",
    origem: "Com base em 6 serviços parecidos"
  }
];

const requisitosPrototipo = [
  {
    nome: "CBSP e HUET válidos",
    motivo: "Toda a equipe · porque o serviço é offshore"
  },
  {
    nome: "NR-35",
    motivo:
      "Quem trabalha no andaime · porque há trabalho em altura"
  },
  {
    nome: "Soldador qualificado",
    motivo: "1 profissional · porque há reparo com solda"
  },
  {
    nome: "Profissional habilitado NR-13",
    motivo:
      "Engenheiro responsável pela inspeção · porque o equipamento é vaso de pressão"
  }
];

export default function LeituraOrdem({ onAnaliseConcluida }) {
  const [ordem, setOrdem] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [entradaVaso, setEntradaVaso] = useState("");
  const [arquivoNome, setArquivoNome] = useState("");

  const inputArquivo = useRef(null);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarOrdem();
        setOrdem(dados);

        // O exemplo OS-2481 usa o texto original do Figma.
        // Outras ordens mantêm a descrição recebida do serviço.
        setDescricao(
          dados.id === "OS-2481"
            ? descricaoPrototipo
            : dados.descricao
        );
      } catch {
        setErro("Não foi possível carregar a ordem.");
      }
    }

    carregar();
  }, []);

  async function importarArquivo(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    setErro("");

    try {
      const texto = await arquivo.text();
      setDescricao(texto);
      setArquivoNome(arquivo.name);
    } catch {
      setErro("Não foi possível ler o arquivo.");
    }

    event.target.value = "";
  }

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

  const dadosDemonstrativos = ordem.id === "OS-2481";

  return (
    <main className="gestor-container">
      <header className="gestor-topo">
        <span className="gestor-etiqueta">
          Ordens de serviço › Nova OS
        </span>

        <div className="gestor-titulo-linha">
          <h1>Interpretação da ordem de serviço</h1>
          <span className="gestor-codigo-os">
            {ordem.id}
          </span>
        </div>
      </header>

      <div className="gestor-colunas">
        <section className="gestor-card gestor-coluna-ordem">
          <div className="gestor-card-topo">
            <h2>1. Ordem de serviço</h2>

            <button
              type="button"
              className="gestor-importar"
              onClick={() => inputArquivo.current?.click()}
            >
              ↑ Importar arquivo
            </button>

            <input
              ref={inputArquivo}
              type="file"
              accept=".txt,text/plain"
              className="gestor-arquivo-oculto"
              onChange={importarArquivo}
              aria-label="Importar descrição em arquivo TXT"
            />
          </div>

          {arquivoNome && (
            <p className="gestor-arquivo-nome">
              Arquivo importado: {arquivoNome}
            </p>
          )}

          <label htmlFor="descricao-os">
            Descrição do serviço
          </label>

          <textarea
            id="descricao-os"
            value={descricao}
            onChange={(event) =>
              setDescricao(event.target.value)
            }
            rows={7}
          />

          <div className="gestor-campos-resumo">
            <div className="gestor-campo">
              <strong>Local</strong>
              <p>{ordem.local}</p>
            </div>

            <div className="gestor-campo">
              <strong>Prazo</strong>
              <p>
                {dadosDemonstrativos
                  ? "18/10/2026"
                  : ordem.prazo}
              </p>
            </div>
          </div>

          <div className="gestor-aviso">
            <span aria-hidden="true">✓</span>
            <span>
              Texto interpretado pela IA. Revise os
              campos ao lado antes de continuar.
            </span>
          </div>
        </section>

        <div className="gestor-coluna-direita">
          <section className="gestor-card gestor-painel-ia">
            <div className="gestor-painel-cabecalho">
              <h2>2. Informações extraídas pela IA</h2>
              <span>Clique em um campo para corrigir</span>
            </div>

            <p className="gestor-nota-demo">
              Prévia demonstrativa do protótipo.
              Os dados ainda não são extraídos por IA.
            </p>

            <div className="gestor-dados-extraidos">
              {informacoesPrototipo.map((item) => (
                <div
                  className="gestor-dado"
                  key={item.titulo}
                >
                  <span>{item.titulo}</span>
                  <strong>{item.valor}</strong>
                  <small>{item.origem}</small>
                </div>
              ))}
            </div>

            <div className="gestor-duvida">
              <span className="gestor-duvida-etiqueta">
                DÚVIDA DA IA
              </span>

              <h3>
                O reparo envolve entrada no interior
                do vaso (espaço confinado)?
              </h3>

              <p>
                A descrição não deixa claro. A resposta
                muda as exigências da equipe.
              </p>

              <div
                className="gestor-opcoes"
                role="group"
                aria-label="Entrada no vaso"
              >
                <label>
                  <input
                    type="radio"
                    name="entrada-vaso"
                    value="nao"
                    checked={entradaVaso === "nao"}
                    onChange={(event) =>
                      setEntradaVaso(event.target.value)
                    }
                  />
                  Não, serviço externo
                </label>

                <label>
                  <input
                    type="radio"
                    name="entrada-vaso"
                    value="sim"
                    checked={entradaVaso === "sim"}
                    onChange={(event) =>
                      setEntradaVaso(event.target.value)
                    }
                  />
                  Sim, há entrada no vaso
                </label>
              </div>
            </div>
          </section>

          <section className="gestor-card gestor-requisitos">
            <h2>3. Requisitos identificados</h2>

            <p className="gestor-texto-auxiliar">
              Regras da matriz de habilitações v1.2,
              aprovada por SST em 01/10/2026
            </p>

            <div className="gestor-lista-requisitos">
              {requisitosPrototipo.map((requisito) => (
                <div
                  className="gestor-requisito"
                  key={requisito.nome}
                >
                  <strong>{requisito.nome}</strong>
                  <span>{requisito.motivo}</span>
                </div>
              ))}
            </div>
          </section>

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
                ? "Buscando equipes..."
                : "Buscar equipes elegíveis"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

