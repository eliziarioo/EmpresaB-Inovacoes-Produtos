import { useEffect, useRef, useState } from 'react'
import { IconeArquivo, IconeFechar } from '../components/Icones.jsx'
import { enviarDocumento } from '../services/adminService.js'
import '../parteA.css'

const OPCOES_STATUS = [
  {
    valor: 'rascunho',
    titulo: 'Rascunho',
    detalhe: 'Não aparece para os técnicos',
  },
  {
    valor: 'aprovado',
    titulo: 'Aprovado',
    detalhe: 'Vai ao assistente e ao modo offline',
  },
]

function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

function EnviarDocumento({ aoFechar, aoEnviar }) {
  const seletorDeArquivo = useRef(null)

  const [arquivo, setArquivo] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [versao, setVersao] = useState('')
  const [dataAprovacao, setDataAprovacao] = useState('')
  const [titulo, setTitulo] = useState('')
  const [aplicaSeA, setAplicaSeA] = useState([])
  const [novoItem, setNovoItem] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    function aoApertarTecla(evento) {
      if (evento.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoApertarTecla)
    return () => window.removeEventListener('keydown', aoApertarTecla)
  }, [aoFechar])

  function aoEscolherArquivo(evento) {
    const escolhido = evento.target.files[0]
    if (!escolhido) return

    if (escolhido.type !== 'application/pdf') {
      setErro('Escolha um arquivo PDF.')
      return
    }
    setErro('')
    setArquivo(escolhido)
  }

  function adicionarItem() {
    const item = novoItem.trim()
    if (item && !aplicaSeA.includes(item)) {
      setAplicaSeA([...aplicaSeA, item])
    }
    setNovoItem('')
  }

  function aoApertarNoItem(evento) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      adicionarItem()
    }
  }

  function removerItem(item) {
    setAplicaSeA(aplicaSeA.filter((atual) => atual !== item))
  }

  async function aoSubmeter(evento) {
    evento.preventDefault()

    if (!arquivo) return setErro('Escolha o arquivo PDF do documento.')
    if (!codigo.trim() || !versao.trim() || !titulo.trim()) {
      return setErro('Preencha código, versão e título.')
    }

    setErro('')
    setEnviando(true)
    try {
      const documento = await enviarDocumento({
        codigo: codigo.trim(),
        versao: versao.trim(),
        titulo: titulo.trim(),
        data_aprovacao: dataAprovacao || null,
        aplica_se_a: aplicaSeA,
        status,
      })
      aoEnviar(documento)
    } catch (falha) {
      setErro(falha.message)
      setEnviando(false)
    }
  }

  return (
    <div className="janela-fundo" onClick={aoFechar}>
      <form
        className="janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="janela-titulo"
        onClick={(evento) => evento.stopPropagation()}
        onSubmit={aoSubmeter}
      >
        <header className="janela-cabecalho">
          <h2 id="janela-titulo">Enviar documento</h2>
          <button
            type="button"
            className="janela-fechar"
            onClick={aoFechar}
            aria-label="Fechar"
          >
            <IconeFechar tamanho={22} />
          </button>
        </header>

        <div className="janela-arquivo">
          <input
            ref={seletorDeArquivo}
            type="file"
            accept="application/pdf"
            hidden
            onChange={aoEscolherArquivo}
          />
          <span className="janela-arquivo-icone">
            <IconeArquivo tamanho={28} />
          </span>
          <div className="janela-arquivo-texto">
            {arquivo ? (
              <>
                <strong>{arquivo.name}</strong>
                <span>PDF · {formatarTamanho(arquivo.size)}</span>
              </>
            ) : (
              <>
                <strong>Nenhum arquivo escolhido</strong>
                <span>Só PDF</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="link"
            onClick={() => seletorDeArquivo.current.click()}
          >
            {arquivo ? 'Trocar' : 'Escolher'}
          </button>
        </div>

        <div className="janela-tres">
          <label className="campo">
            <span>Código</span>
            <input
              className="campo-codigo campo-exemplo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="PR-ESP-021"
            />
          </label>
          <label className="campo">
            <span>Versão</span>
            <input
              className="campo-exemplo"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              placeholder="v1"
            />
          </label>
          <label className="campo">
            <span>Data de aprovação</span>
            <input
              type="date"
              value={dataAprovacao}
              onChange={(e) => setDataAprovacao(e.target.value)}
            />
          </label>
        </div>

        <label className="campo">
          <span>Título</span>
          <input
            className="campo-exemplo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Entrada em espaço confinado (NR-33)"
          />
        </label>

        <div className="campo">
          <span>Aplica-se a</span>
          <div className="etiquetas">
            {aplicaSeA.map((item) => (
              <span key={item} className="etiqueta">
                {item}
                <button
                  type="button"
                  onClick={() => removerItem(item)}
                  aria-label={`Remover ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              onKeyDown={aoApertarNoItem}
              onBlur={adicionarItem}
              placeholder="+ adicionar"
              aria-label="Adicionar equipamento ou tipo de OS"
            />
          </div>
          <small className="campo-ajuda">
            Equipamentos ou tipos de OS em que o assistente usa o documento.
          </small>
        </div>

        <fieldset className="janela-status">
          <legend>Status</legend>
          {OPCOES_STATUS.map((opcao) => (
            <label
              key={opcao.valor}
              className={
                status === opcao.valor
                  ? 'status-opcao status-opcao-ativa'
                  : 'status-opcao'
              }
            >
              <input
                type="radio"
                name="status"
                value={opcao.valor}
                checked={status === opcao.valor}
                onChange={() => setStatus(opcao.valor)}
              />
              <span>
                <strong>{opcao.titulo}</strong>
                <small>{opcao.detalhe}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {erro && (
          <p className="login-erro" role="alert">
            {erro}
          </p>
        )}

        <footer className="janela-rodape">
          <span>No protótipo, o envio é simulado.</span>
          <button type="button" className="botao-secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="botao-principal botao-auto"
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar documento'}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default EnviarDocumento
