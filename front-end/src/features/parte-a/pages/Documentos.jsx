import { useEffect, useState } from 'react'
import { IconeCheck, IconeLapis, IconeQuadrado } from '../components/Icones.jsx'
import Auditoria from './Auditoria.jsx'
import EnviarDocumento from './EnviarDocumento.jsx'
import Usuarios from './Usuarios.jsx'
import {
  abrirArquivoDoDocumento,
  buscarDocumentos,
} from '../services/adminService.js'
import '../parteA.css'

const STATUS = {
  aprovado: { texto: 'Aprovado', classe: 'selo-apto', Icone: IconeCheck },
  rascunho: { texto: 'Rascunho', classe: 'selo-atencao', Icone: IconeLapis },
  obsoleto: { texto: 'Obsoleto', classe: 'selo-neutro', Icone: IconeQuadrado },
}

function formatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function Documentos() {
  const [documentos, setDocumentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [janelaAberta, setJanelaAberta] = useState(false)
  const [aviso, setAviso] = useState('')
  const [envios, setEnvios] = useState(0)

  useEffect(() => {
    let ativo = true

    buscarDocumentos()
      .then((dados) => {
        if (ativo) setDocumentos(dados)
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  async function abrirArquivo(documento) {
    setErro('')
    try {
      await abrirArquivoDoDocumento(documento.arquivo_url)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function aoEnviarDocumento(documento) {
    setDocumentos((atuais) => [...atuais, documento])
    setEnvios((atual) => atual + 1)
    setJanelaAberta(false)
    setAviso(`Documento ${documento.codigo} enviado (simulado).`)
  }

  return (
    <>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Documentos</h1>
          <p className="pagina-apoio">
            Documentos que o assistente consulta, quem tem acesso e o histórico
            de alterações. Só documentos aprovados chegam ao técnico.
          </p>
        </div>
        <button
          type="button"
          className="botao-principal botao-auto"
          onClick={() => {
            setAviso('')
            setJanelaAberta(true)
          }}
        >
          + Enviar documento
        </button>
      </div>

      {aviso && (
        <p className="aviso-sucesso" role="status">
          {aviso}
        </p>
      )}

      {erro && (
        <p className="login-erro" role="alert">
          {erro}
        </p>
      )}

      <section className="cartao">
        <header className="cartao-cabecalho">
          <h2>Documentos</h2>
          <span>{documentos.length} documentos</span>
        </header>

        {carregando ? (
          <p className="pagina-apoio cartao-vazio">Carregando documentos...</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Versão</th>
                <th>Status</th>
                <th>Aprovado em</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento, indice) => {
                const status = STATUS[documento.status]
                const obsoleto = documento.status === 'obsoleto'
                return (
                  <tr
                    key={documento.id}
                    className={obsoleto ? 'linha-apagada' : ''}
                  >
                    <td>
                      <div className="documento-nome">
                        <span className="documento-numero">
                          {String(indice + 1).padStart(2, '0')}
                        </span>
                        {documento.arquivo_url ? (
                          <button
                            type="button"
                            className="documento-abrir"
                            onClick={() => abrirArquivo(documento)}
                            title="Abrir o PDF"
                          >
                            {documento.titulo}
                          </button>
                        ) : (
                          <span>{documento.titulo}</span>
                        )}
                      </div>
                    </td>
                    <td>{documento.versao}</td>
                    <td>
                      {status && (
                        <span className={`selo ${status.classe}`}>
                          <status.Icone />
                          {status.texto}
                        </span>
                      )}
                    </td>
                    <td>{formatarData(documento.aprovado_em)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <div className="documentos-baixo">
        <Usuarios />
        <Auditoria atualizacao={envios} />
      </div>

      {janelaAberta && (
        <EnviarDocumento
          aoFechar={() => setJanelaAberta(false)}
          aoEnviar={aoEnviarDocumento}
        />
      )}
    </>
  )
}

export default Documentos
