import { useEffect, useRef, useState } from "react";
import Icone from "../components/Icone.jsx";
import CitacaoDocumento from "../components/CitacaoDocumento.jsx";
import RespostaNaoEncontrada from "../components/RespostaNaoEncontrada.jsx";
import {
  perguntaInicial,
  respostaInicial,
  sugestoesFigma,
} from "../data/cenarioFigma.js";

export default function Assistente({
  servico,
  modo,
  offline,
  aoVoltar,
  aoPerguntar,
  aoAbrirDocumento,
  aoContato,
  aoAviso,
}) {
  const [conversa, setConversa] = useState(() =>
    modo === "demo" && !offline && servico?.ordem_id === "OS-2481"
      ? [{ pergunta: perguntaInicial, resposta: respostaInicial }]
      : [],
  );
  const [pergunta, setPergunta] = useState(""),
    [enviando, setEnviando] = useState(false),
    [erro, setErro] = useState(""),
    [expandido, setExpandido] = useState(false),
    [ditando, setDitando] = useState(false);
  const reconhecimento = useRef(null),
    vivo = useRef(true),
    rolagem = useRef(null),
    pedido = useRef(0);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      reconhecimento.current?.abort();
    };
  }, []);
  async function enviar(texto) {
    const limpa = texto.trim();
    if (!limpa || enviando) return;
    if (!servico) {
      setErro("Selecione um serviço antes de perguntar.");
      return;
    }
    const id = ++pedido.current;
    setEnviando(true);
    setErro("");
    try {
      const resposta = await aoPerguntar(limpa);
      if (!vivo.current || id !== pedido.current) return;
      setConversa((a) => [...a, { pergunta: limpa, resposta }]);
      setPergunta("");
      setExpandido(false);
      rolagem.current?.scrollTo({ top: 0 });
    } catch (e) {
      if (vivo.current) setErro(e.message);
    } finally {
      if (vivo.current) setEnviando(false);
    }
  }
  function ditar() {
    if (ditando) {
      reconhecimento.current?.stop();
      return;
    }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      aoAviso(
        "Ditado indisponível",
        "Este navegador não oferece reconhecimento de voz. Você pode digitar a pergunta.",
      );
      return;
    }
    if (offline) {
      aoAviso(
        "Ditado sem conexão",
        "O ditado depende do serviço de voz do navegador. Use o teclado para pesquisar nos documentos baixados.",
      );
      return;
    }
    const r = new Speech();
    reconhecimento.current = r;
    r.lang = "pt-BR";
    r.interimResults = false;
    r.onresult = (e) => {
      if (vivo.current) setPergunta(e.results[0][0].transcript);
    };
    r.onerror = () => {
      if (vivo.current) {
        setDitando(false);
        setErro(
          "Não foi possível usar o microfone. Confira a permissão ou digite a pergunta.",
        );
      }
    };
    r.onend = () => {
      if (vivo.current) setDitando(false);
    };
    try {
      r.start();
      setDitando(true);
    } catch {
      setErro("Não foi possível iniciar o ditado.");
    }
  }
  const ultimo = conversa.at(-1),
    historico = expandido ? conversa : conversa.slice(-1);
  return (
    <>
      <header className="tc-chat-cabecalho">
        <div>
          <button
            className="tc-voltar"
            aria-label="Voltar ao início"
            onClick={aoVoltar}
          >
            <Icone id="6-219-imgGroup" tamanho={20} />
          </button>
          <h1>Assistente de procedimentos</h1>
        </div>
        {servico && (
          <div className="tc-contexto">
            <span className="tc-codigo">{servico.ordem_id}</span>
            {servico.equipamento && <span>{servico.equipamento}</span>}
            <span>{servico.documentos_ids.length} documentos autorizados</span>
          </div>
        )}
      </header>
      <main className="tc-rolagem tc-chat" ref={rolagem}>
        <p className="tc-limite">
          <Icone id="6-219-imgGroup1" tamanho={16} />
          Respostas baseadas só nos documentos aprovados. Não substituem o
          procedimento oficial nem a permissão de trabalho.
        </p>
        {conversa.length > 1 && !expandido && (
          <button className="tc-historico" onClick={() => setExpandido(true)}>
            Conversa anterior ·{" "}
            {servico?.ordem_id === "OS-2481" ? "PR-SOL-014" : servico?.ordem_id}
          </button>
        )}
        {!conversa.length && (
          <p className="tc-texto-suave">
            {offline
              ? "Pesquise nos documentos baixados. Os resultados são trechos originais, sem resposta gerada por IA."
              : "Pergunte sobre o serviço selecionado."}
          </p>
        )}
        {historico.map((item, i) => (
          <section className="tc-troca" key={`${i}-${item.pergunta}`}>
            <div className="tc-pergunta-linha">
              <p className="tc-pergunta">{item.pergunta}</p>
            </div>
            {item.resposta.tipo === "nao_encontrada" ? (
              <RespostaNaoEncontrada
                resposta={item.resposta}
                aoContato={aoContato}
              />
            ) : item.resposta.tipo === "trechos" ? (
              <div className="tc-resultados-locais">
                <p className="tc-texto-suave">
                  Busca local · trechos dos documentos baixados
                </p>
                {item.resposta.trechos.map((t, j) => (
                  <div className="tc-balao" key={j}>
                    <CitacaoDocumento citacao={t} />
                    <button
                      className="tc-abrir-original"
                      onClick={() => aoAbrirDocumento(t.documento_id, t.pagina)}
                    >
                      <Icone id="6-219-imgGroup2" tamanho={16} />
                      Abrir documento original
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tc-balao">
                <p className="tc-resposta-texto">{item.resposta.resposta}</p>
                {item.resposta.passos && (
                  <ol>
                    {item.resposta.passos.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ol>
                )}
                {item.resposta.citacao && (
                  <>
                    <CitacaoDocumento citacao={item.resposta.citacao} />
                    <button
                      className="tc-abrir-original"
                      onClick={() =>
                        aoAbrirDocumento(
                          item.resposta.citacao.documento_id,
                          item.resposta.citacao.pagina,
                        )
                      }
                    >
                      <Icone id="6-219-imgGroup2" tamanho={16} />
                      Abrir documento original
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        ))}
        {!offline && ultimo?.resposta.tipo === "resposta" && (
          <section className="tc-sugestoes">
            <h2>Sugestões</h2>
            {sugestoesFigma.map((s) => (
              <button key={s} disabled={enviando} onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </section>
        )}
        {enviando && (
          <p role="status" className="tc-texto-suave">
            Consultando documentos…
          </p>
        )}
        {erro && (
          <p role="alert" className="tc-erro">
            {erro}
          </p>
        )}
      </main>
      <form
        className="tc-perguntar"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(pergunta);
        }}
      >
        <input
          aria-label="Pergunte sobre este serviço"
          placeholder="Pergunte sobre este serviço"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          disabled={!servico}
        />
        <button
          type="button"
          className={`tc-ditar ${ditando ? "tc-ditando" : ""}`}
          aria-label={ditando ? "Parar ditado" : "Ditar pergunta"}
          onClick={ditar}
        >
          <Icone id="6-219-imgGroup3" tamanho={20} />
        </button>
        <button
          className="tc-enviar"
          aria-label="Enviar pergunta"
          disabled={enviando || !servico}
        >
          <Icone id="6-219-imgGroup4" tamanho={20} />
        </button>
      </form>
    </>
  );
}
