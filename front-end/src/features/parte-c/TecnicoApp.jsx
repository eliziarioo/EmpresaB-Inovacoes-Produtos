import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { criarServico, modoPadrao } from "./services/tecnicoService.js";
import { guardar, ler, apagar } from "./services/armazenamentoService.js";
import {
  baixarPacote,
  lerPacote,
  buscarTrechos,
  conferirVersoes,
  prefixoUsuario,
} from "./services/offlineService.js";
import {
  enfileirar,
  pendentes,
  sincronizarFila,
} from "./services/sincronizacaoService.js";
import LoginTecnico from "./pages/LoginTecnico.jsx";
import InicioTecnico from "./pages/InicioTecnico.jsx";
import ServicosTecnico from "./pages/ServicosTecnico.jsx";
import DocumentosTecnico from "./pages/DocumentosTecnico.jsx";
import Assistente from "./pages/Assistente.jsx";
import CabecalhoTecnico from "./components/CabecalhoTecnico.jsx";
import NavegacaoTecnico from "./components/NavegacaoTecnico.jsx";
import PerfilTecnico from "./components/PerfilTecnico.jsx";
import AvisoOffline from "./components/AvisoOffline.jsx";
import Modal from "./components/Modal.jsx";
import "./parteC.css";

const rotaAtual = () =>
  ["inicio", "servicos", "documentos", "assistente"].includes(
    location.hash.slice(1),
  )
    ? location.hash.slice(1)
    : "inicio";
function sessaoGuardada(modo) {
  try {
    return JSON.parse(localStorage.getItem(`tc-sessao:${modo}`));
  } catch {
    return null;
  }
}
export default function TecnicoApp({
  modo = modoPadrao,
  perfil: perfilExterno,
  aoSair: aoSairExterno,
}) {
  const api = useMemo(() => criarServico(modo), [modo]);
  const [perfil, setPerfil] = useState(
      () => perfilExterno || sessaoGuardada(modo),
    ),
    [dados, setDados] = useState(null),
    [tela, setTela] = useState(rotaAtual),
    [selecionada, setSelecionada] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine),
    [erro, setErro] = useState(""),
    [modal, setModal] = useState(null),
    [perfilAberto, setPerfilAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false),
    [pacote, setPacote] = useState(null),
    [fila, setFila] = useState(0),
    [statusSync, setStatusSync] = useState("");
  const usuario = perfil ? prefixoUsuario(modo, perfil) : null;
  const servico =
    dados?.servicos.find((s) => s.ordem_id === selecionada) ||
    dados?.servicos.find((s) => s.estado !== "concluida") ||
    null;
  const informar = (titulo, texto) =>
    setModal({ tipo: "mensagem", titulo, texto });
  const navegar = useCallback((destino) => {
    location.hash = destino;
    setTela(destino);
  }, []);
  useEffect(() => {
    const atualizar = () => setTela(rotaAtual());
    addEventListener("hashchange", atualizar);
    return () => removeEventListener("hashchange", atualizar);
  }, []);
  useEffect(() => {
    const on = () => setOffline(false),
      off = () => setOffline(true);
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);
  const atualizarFila = useCallback(async () => {
    if (usuario) setFila((await pendentes(usuario)).length);
  }, [usuario]);
  useEffect(() => {
    if (!perfil) return;
    let cancelado = false;
    async function carregar() {
      let local;
      try {
        setErro("");
        local = await ler(`contexto:${usuario}`);
        if (cancelado) return;
        if (local) setDados(local);
        if (!navigator.onLine) {
          if (!local)
            throw new Error(
              "Entre com internet e baixe o serviço antes de usar sem conexão.",
            );
          return;
        }
        const remoto = await api.carregar();
        if (cancelado) return;
        setDados(remoto);
        await guardar(`contexto:${usuario}`, remoto);
      } catch (e) {
        if (!cancelado) {
          if (!e.status && local) { setOffline(true); setErro(""); }
          else setErro(e.message);
        }
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [api, perfil, usuario, offline]);
  useEffect(() => {
    let ativo = true;
    if (usuario && servico)
      lerPacote(usuario, servico.ordem_id)
        .then((p) => {
          if (ativo) setPacote(p);
        })
        .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [usuario, servico]);
  const sincronizar = useCallback(async () => {
    if (!usuario || !navigator.onLine) return;
    const avisos = [];
    // A conferência não impede o envio de registros válidos quando um índice
    // de documento ainda aguarda atualização pelo administrador.
    try { await conferirVersoes(api, usuario); }
    catch (e) { avisos.push(e.message); }
    try {
      const total = await sincronizarFila(api, usuario);
      await atualizarFila();
      if (total)
        avisos.push(
          modo === "demo"
            ? `${total} registro(s) confirmado(s) na demonstração local.`
            : `${total} registro(s) enviado(s) à API.`,
        );
    } catch (e) {
      avisos.push(e.message);
      await atualizarFila();
    }
    if (avisos.length) setStatusSync(avisos.join(' '));
  }, [api, usuario, modo, atualizarFila]);
  useEffect(() => {
    if (!usuario) return;
    // Consulta externa ao IndexedDB, não um estado derivado da renderização.
    // oxlint-disable-next-line react/set-state-in-effect
    atualizarFila();
    // Sincroniza a fila persistente com um sistema externo (IndexedDB/API).
    // oxlint-disable-next-line react/set-state-in-effect
    if (!offline) sincronizar();
    const timer = setInterval(() => {
      if (!navigator.onLine) return;
      if (offline) {
        // O servidor pode voltar sem o navegador disparar o evento "online".
        api.carregar().then(() => setOffline(false)).catch(() => {});
      } else sincronizar();
    }, 30000);
    return () => clearInterval(timer);
  }, [api, usuario, offline, sincronizar, atualizarFila]);
  async function entrar(email, senha) {
    const p = await api.entrar(email, senha);
    localStorage.setItem(`tc-sessao:${modo}`, JSON.stringify(p));
    setPerfil(p);
    navegar("inicio");
  }
  async function sair() {
    await api.sair();
    localStorage.removeItem(`tc-sessao:${modo}`);
    // O histórico offline é isolado por usuário. A fila fica preservada para o próximo login.
    setPerfil(null);
    setDados(null);
    setPerfilAberto(false);
    setPacote(null);
    setFila(0);
    setModal(null);
    navegar("inicio");
    aoSairExterno?.();
  }
  async function registrar(tipo, conteudo) {
    if (!usuario || !servico) return;
    await enfileirar(usuario, servico.ordem_id, tipo, conteudo);
    await atualizarFila();
    if (navigator.onLine) sincronizar();
  }
  async function pesquisarLocal(texto) {
    const p = await lerPacote(usuario, servico.ordem_id);
    if (!p)
      throw new Error(
        "Este serviço não foi baixado. Conecte-se e use Documentos → Gerenciar acesso offline.",
      );
    if (p.desatualizado || p.revogado)
      throw new Error(
        "Este pacote foi alterado ou revogado. Reconecte-se e atualize os documentos antes de consultar.",
      );
    const trechos = buscarTrechos(p, texto);
    await registrar("consulta_offline", { pergunta: texto });
    return trechos.length
      ? { tipo: "trechos", trechos }
      : {
          tipo: "nao_encontrada",
          resposta: "Não encontrei esse termo nos documentos baixados.",
          complemento:
            "Tente outras palavras ou confirme com o responsável. Nenhuma resposta foi gerada por IA.",
        };
  }
  async function perguntar(texto) {
    if (offline) return pesquisarLocal(texto);
    try {
      return await api.perguntar(servico, texto);
    } catch (e) {
      if (e.status) throw e;
      const p = await lerPacote(usuario, servico.ordem_id);
      if (p) {
        setOffline(true);
        return pesquisarLocal(texto);
      }
      throw e;
    }
  }
  async function abrirDocumento(id, pagina = 1) {
    const doc =
      typeof id === "string" ? dados.documentos.find((d) => d.id === id) : id;
    if (!doc) {
      informar(
        "Documento indisponível",
        "O documento não está disponível para este perfil.",
      );
      return;
    }
    try {
      let arquivo;
      if (offline) {
        const p = await lerPacote(usuario, servico?.ordem_id);
        if (!p || p.desatualizado || p.revogado)
          throw new Error(
            "Baixe uma versão vigente deste serviço antes de abrir sem internet.",
          );
        arquivo = p.arquivos[doc.id];
        if (!arquivo)
          throw new Error(
            "Este documento não foi baixado para o serviço selecionado.",
          );
        await registrar("documento_aberto", { documento_id: doc.id, pagina });
      } else arquivo = await api.abrirArquivo(doc);
      setModal({ tipo: "documento", titulo: doc.titulo, arquivo, pagina });
    } catch (e) {
      informar("Documento indisponível", e.message);
    }
  }
  async function baixar() {
    if (!servico) return;
    setOcupado(true);
    setStatusSync("");
    try {
      const p = await baixarPacote(api, usuario, servico);
      setPacote(p);
      setStatusSync("Serviço e documentos salvos neste aparelho.");
    } catch (e) {
      setStatusSync(e.message);
    } finally {
      setOcupado(false);
    }
  }
  function abrirOffline() {
    setModal({ tipo: "offline", titulo: "Acesso offline" });
    atualizarFila();
  }
  async function removerPacote() {
    if (!pacote) return;
    await apagar(`pacote:${usuario}:${pacote.ordem.ordem_id}`);
    setPacote(null);
    setStatusSync(
      "Pacote removido deste aparelho. Registros pendentes foram preservados.",
    );
  }
  const atual = dados?.perfil || perfil;
  const documentos = (servico?.documentos_ids || [])
    .map((id) => dados?.documentos.find((d) => d.id === id))
    .filter(Boolean);
  const seguintes =
    dados?.servicos.filter(
      (s) => s.estado !== "concluida" && s.ordem_id !== servico?.ordem_id,
    ) || [];
  return (
    <div className="tc-app">
      {!perfil ? (
        <LoginTecnico
          modo={modo}
          aoEntrar={entrar}
          aoRecuperar={() =>
            informar(
              "Recuperar acesso",
              "Solicite a redefinição de senha ao administrador da sua empresa.",
            )
          }
        />
      ) : (
        <>
          <AvisoOffline
            offline={offline}
            pendencias={fila}
            aoAbrir={abrirOffline}
          />
          {erro && (
            <div className="tc-erro-global" role="alert">
              {erro}
              <button
                onClick={() => {
                  setOffline(false);
                  setPerfil({ ...perfil });
                }}
              >
                Tentar novamente
              </button>
              {!dados && <button onClick={sair}>Voltar ao login</button>}
            </div>
          )}
          {!dados ? (
            <main className="tc-rolagem">
              <p role="status">
                {erro ? "Dados indisponíveis." : "Carregando seu serviço…"}
              </p>
            </main>
          ) : tela === "assistente" ? (
            <Assistente
              key={servico?.ordem_id || "vazio"}
              modo={modo}
              offline={offline}
              servico={servico}
              aoVoltar={() => navegar("inicio")}
              aoPerguntar={perguntar}
              aoAbrirDocumento={abrirDocumento}
              aoAviso={informar}
              aoContato={(p) =>
                informar(
                  p.rotulo || `Falar com ${p.nome}`,
                  `${p.nome} é o responsável indicado. Use o canal de contato da equipe. O contato direto ainda não está disponível.`,
                )
              }
            />
          ) : (
            <>
              <CabecalhoTecnico
                perfil={atual}
                aoPerfil={() => setPerfilAberto(true)}
                apoio={
                  tela === "inicio"
                    ? dados.data_texto
                    : tela === "documentos"
                      ? "Somente leitura"
                      : `${dados.servicos.filter((s) => s.estado !== "concluida").length} próximos · ${dados.servicos.filter((s) => s.estado === "concluida").length} concluídos`
                }
                titulo={
                  tela === "inicio"
                    ? `Olá, ${atual.primeiro_nome || atual.nome.split(" ")[0]}`
                    : tela === "servicos"
                      ? "Seus serviços"
                      : "Documentos"
                }
              />
              {tela === "inicio" ? (
                <InicioTecnico
                  servico={servico}
                  documentos={documentos}
                  seguinte={seguintes[0]}
                  aoAssistente={() => navegar("assistente")}
                />
              ) : tela === "servicos" ? (
                <ServicosTecnico
                  servicos={dados.servicos}
                  aoSelecionar={(s) => {
                    setSelecionada(s.ordem_id);
                    navegar("inicio");
                  }}
                />
              ) : (
                <DocumentosTecnico
                  documentos={dados.documentos}
                  aoAbrir={abrirDocumento}
                  aoOffline={abrirOffline}
                />
              )}
              <NavegacaoTecnico ativa={tela} aoNavegar={navegar} />
            </>
          )}
        </>
      )}
      {perfilAberto && (
        <PerfilTecnico
          perfil={atual}
          aoFechar={() => setPerfilAberto(false)}
          aoSair={sair}
        />
      )}
      {modal && (
        <Modal
          titulo={modal.titulo}
          aoFechar={() => setModal(null)}
          classe={modal.tipo === "documento" ? "tc-visualizador" : ""}
        >
          {modal.tipo === "mensagem" && (
            <>
              <p>{modal.texto}</p>
              <button className="tc-secundario" onClick={() => setModal(null)}>
                Entendi
              </button>
            </>
          )}
          {modal.tipo === "documento" && (
            <Visualizador
              arquivo={modal.arquivo}
              pagina={modal.pagina}
              titulo={modal.titulo}
            />
          )}
          {modal.tipo === "offline" && (
            <div className="tc-painel-offline">
              <p>
                {servico
                  ? `Serviço selecionado: ${servico.ordem_id}`
                  : "Selecione um serviço primeiro."}
              </p>
              <p>
                {pacote
                  ? `Baixado em ${new Date(pacote.baixado_em).toLocaleString("pt-BR")}`
                  : "Nenhum pacote baixado para este serviço."}
              </p>
              <p>{fila} registro(s) pendente(s).</p>
              {offline && (
                <>
                  <p>
                    Sem conexão: somente documentos previamente baixados. A
                    versão será conferida ao reconectar.
                  </p>
                  <button
                    className="tc-secundario"
                    onClick={() => {
                      if (navigator.onLine) {
                        setOffline(false);
                        sincronizar();
                      } else
                        setStatusSync("O aparelho ainda está sem conexão.");
                    }}
                  >
                    Tentar reconectar
                  </button>
                </>
              )}
              <button
                className="tc-primario"
                disabled={offline || ocupado || !servico}
                onClick={baixar}
              >
                {ocupado
                  ? "Baixando…"
                  : pacote
                    ? "Atualizar pacote"
                    : "Baixar serviço e documentos"}
              </button>
              <button
                className="tc-secundario"
                disabled={offline || ocupado}
                onClick={sincronizar}
              >
                Conferir versões e sincronizar
              </button>
              {pacote && (
                <button className="tc-link" onClick={removerPacote}>
                  Remover pacote deste aparelho
                </button>
              )}
              {statusSync && <p role="status">{statusSync}</p>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function Visualizador({ arquivo, pagina, titulo }) {
  const frame = useRef(null), link = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    frame.current.src = `${url}#page=${pagina}`;
    link.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [arquivo, pagina]);
  return <><iframe ref={frame} title={titulo}/><a ref={link} className="tc-secundario" target="_blank" rel="noreferrer">Abrir PDF em outra aba</a></>;
}
