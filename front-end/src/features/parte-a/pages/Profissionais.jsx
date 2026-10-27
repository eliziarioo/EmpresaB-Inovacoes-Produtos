import { useEffect, useState } from 'react'
import { IconeAlerta, IconeCheck, IconeFechar } from '../components/Icones.jsx'
import { buscarPainel, buscarProfissionais } from '../services/adminService.js'
import '../parteA.css'

const PROFISSIONAIS = [
  {
    id: 'pro-001',
    nome: 'Carlos Mendes',
    cargo: 'Engenheiro de inspeção',
    funcao: 'engenharia de inspeção',
    base: 'Macaé',
    disponibilidade: { tipo: 'disponivel', texto: 'Disponível', classe: 'selo-apto' },
    certificacao: { situacao: 'em-dia', texto: 'Em dia' },
  },
  {
    id: 'pro-002',
    nome: 'Ana Ribeiro',
    cargo: 'Soldadora',
    funcao: 'soldador',
    base: 'Macaé',
    disponibilidade: { tipo: 'ocupado', texto: 'Alocada · OS-2481', classe: 'selo-atencao' },
    certificacao: { situacao: 'em-dia', texto: 'Em dia' },
  },
  {
    id: 'pro-003',
    nome: 'Paulo Souza',
    cargo: 'Caldeireiro',
    funcao: 'caldeireiro',
    base: 'Macaé',
    disponibilidade: { tipo: 'ocupado', texto: 'Alocado · OS-2481', classe: 'selo-atencao' },
    certificacao: { situacao: 'em-dia', texto: 'Em dia' },
  },
  {
    id: 'pro-004',
    nome: 'Jorge Lima',
    cargo: 'Soldador',
    funcao: 'soldador',
    base: 'Macaé',
    disponibilidade: { tipo: 'bloqueado', texto: 'Bloqueado offshore', classe: 'selo-bloqueio' },
    certificacao: { situacao: 'vencida', texto: 'HUET vencido' },
  },
  {
    id: 'pro-006',
    nome: 'Marcos Teixeira',
    cargo: 'Caldeireiro',
    funcao: 'caldeireiro',
    base: 'Macaé',
    disponibilidade: { tipo: 'ocupado', texto: 'Embarcado até 20/10', classe: 'selo-neutro' },
    certificacao: { situacao: 'vencendo', texto: 'CBSP vence 30/11' },
  },
  {
    id: 'pro-005',
    nome: 'Rita Fonseca',
    cargo: 'Inspetora',
    funcao: 'engenharia de inspeção',
    base: 'Vitória',
    disponibilidade: {
      tipo: 'disponivel',
      texto: 'Disponível · só onshore',
      classe: 'selo-atencao',
    },
    certificacao: { situacao: 'vencendo', texto: 'Sem NR-35' },
  },
  {
    id: 'pro-007',
    nome: 'Rafael Duarte',
    cargo: 'Soldador',
    funcao: 'soldador',
    base: 'Vitória',
    disponibilidade: { tipo: 'disponivel', texto: 'Disponível', classe: 'selo-apto' },
    certificacao: { situacao: 'em-dia', texto: 'Em dia' },
  },
]

const DETALHE_DO_FIGMA = {
  'pro-004': {
    aviso: {
      tipo: 'vencida',
      destaque: 'Fora de escalas offshore.',
      resto: ' O HUET venceu em 02/10 e precisa ser renovado.',
    },
    certificacoes: [
      { nome: 'HUET', texto: 'Vencido em 02/10', classe: 'selo-bloqueio' },
      { nome: 'CBSP', texto: 'Até 04/2028', classe: 'selo-apto' },
      { nome: 'NR-35', texto: 'Até 01/2027', classe: 'selo-apto' },
      { nome: 'Soldador qualificado', texto: 'Até 03/2027', classe: 'selo-apto' },
    ],
    tituloServicos: 'Últimos serviços',
    servicos: [
      { rotulo: 'OS-2451 · Solda em tubulação', data: '22/09' },
      { rotulo: 'OS-2437 · Reparo em suporte', data: '05/09' },
    ],
    renovacao: true,
  },
}

const DIAS_PARA_VENCIMENTO_PROXIMO = 45

const NOMES_DAS_CERTIFICACOES = {
  SOLDADOR_QUALIFICADO: 'Soldador qualificado',
}

function nomeDaCertificacao(codigo) {
  return NOMES_DAS_CERTIFICACOES[codigo] || codigo
}

function diaEMes(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function mesEAno(iso) {
  const [ano, mes] = iso.split('-')
  return `${mes}/${ano}`
}

function diasEntre(inicio, fim) {
  const [anoA, mesA, diaA] = inicio.split('-').map(Number)
  const [anoB, mesB, diaB] = fim.split('-').map(Number)
  const milissegundos = Date.UTC(anoB, mesB - 1, diaB) - Date.UTC(anoA, mesA - 1, diaA)
  return Math.round(milissegundos / 86400000)
}

function capitalizar(texto) {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function situacaoDaCertificacao(certificacao, hoje) {
  if (certificacao.validade < hoje) return 'vencida'
  if (diasEntre(hoje, certificacao.validade) <= DIAS_PARA_VENCIMENTO_PROXIMO) {
    return 'vencendo'
  }
  return 'em-dia'
}

function detalheDaApi(profissionalDaApi, hoje) {
  const certificacoes = profissionalDaApi.certificacoes.map((certificacao) => ({
    ...certificacao,
    situacao: situacaoDaCertificacao(certificacao, hoje),
  }))
  const pendencia =
    certificacoes.find((item) => item.situacao === 'vencida') ||
    certificacoes.find((item) => item.situacao === 'vencendo') ||
    null

  let aviso = null
  if (pendencia) {
    const nome = nomeDaCertificacao(pendencia.codigo)
    if (pendencia.situacao === 'vencida') {
      const restricao = ['CBSP', 'HUET'].includes(pendencia.codigo)
        ? 'Fora de escalas offshore.'
        : `Fora de escalas que exigem ${nome}.`
      aviso = {
        tipo: 'vencida',
        destaque: restricao,
        resto: ` O ${nome} venceu em ${diaEMes(pendencia.validade)} e precisa ser renovado.`,
      }
    } else {
      aviso = {
        tipo: 'vencendo',
        destaque: '',
        resto: `O ${nome} vence em ${diaEMes(pendencia.validade)} (em ${diasEntre(hoje, pendencia.validade)} dias).`,
      }
    }
  }

  return {
    aviso,
    certificacoes: certificacoes.map((certificacao) => ({
      nome: nomeDaCertificacao(certificacao.codigo),
      texto:
        certificacao.situacao === 'vencida'
          ? `Vencido em ${diaEMes(certificacao.validade)}`
          : certificacao.situacao === 'vencendo'
            ? `Vence em ${diaEMes(certificacao.validade)}`
            : `Até ${mesEAno(certificacao.validade)}`,
      classe:
        certificacao.situacao === 'vencida'
          ? 'selo-bloqueio'
          : certificacao.situacao === 'vencendo'
            ? 'selo-atencao'
            : 'selo-apto',
    })),
    tituloServicos: 'Serviços',
    servicos: profissionalDaApi.alocacoes.map((alocacao) => ({
      rotulo: `${alocacao.ordem_id} · ${capitalizar(alocacao.status)}`,
      data: `${diaEMes(alocacao.inicio)} a ${diaEMes(alocacao.fim)}`,
    })),
    renovacao: Boolean(pendencia),
  }
}

function Profissionais() {
  const [filtro, setFiltro] = useState('todos')
  const [especialidade, setEspecialidade] = useState('todas')
  const [selecionadoId, setSelecionadoId] = useState('pro-004')
  const [detalhesDaApi, setDetalhesDaApi] = useState({})

  useEffect(() => {
    let ativo = true

    Promise.all([buscarProfissionais(), buscarPainel()])
      .then(([profissionaisDaApi, painel]) => {
        if (!ativo) return
        const detalhes = {}
        profissionaisDaApi.forEach((profissional) => {
          detalhes[profissional.id] = detalheDaApi(profissional, painel.data_referencia)
        })
        setDetalhesDaApi(detalhes)
      })
      .catch(() => {})

    return () => {
      ativo = false
    }
  }, [])

  const disponiveis = PROFISSIONAIS.filter((item) => item.disponibilidade.tipo === 'disponivel')
  const ocupados = PROFISSIONAIS.filter((item) => item.disponibilidade.tipo === 'ocupado')
  const comPendencia = PROFISSIONAIS.filter((item) => item.certificacao.situacao !== 'em-dia')
  const especialidades = [...new Set(PROFISSIONAIS.map((item) => item.funcao))]

  const visiveis = PROFISSIONAIS.filter((item) => {
    if (especialidade !== 'todas' && item.funcao !== especialidade) return false
    if (filtro === 'disponiveis') return item.disponibilidade.tipo === 'disponivel'
    if (filtro === 'pendencia') return item.certificacao.situacao !== 'em-dia'
    return true
  })

  const selecionado = PROFISSIONAIS.find((item) => item.id === selecionadoId) || null
  const detalhe = selecionado
    ? DETALHE_DO_FIGMA[selecionado.id] || detalhesDaApi[selecionado.id] || null
    : null

  return (
    <>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Profissionais</h1>
          <p className="pagina-apoio">
            Quem está disponível, onde está e se as certificações estão em dia.
          </p>
        </div>
        <button type="button" className="botao-secundario botao-auto">
          + Cadastrar profissional
        </button>
      </div>

      <section className="contadores contadores-tres" aria-label="Resumo">
        <div className="contador">
          <span>Disponíveis agora</span>
          <strong>
            {disponiveis.length} de {PROFISSIONAIS.length}
          </strong>
        </div>
        <div className="contador">
          <span>Alocados ou embarcados</span>
          <strong>{ocupados.length}</strong>
        </div>
        <div className="contador contador-bloqueio">
          <span>Com pendência de certificação</span>
          <strong>{comPendencia.length}</strong>
        </div>
      </section>

      <div className={selecionado ? 'painel-colunas' : ''}>
        <section className="cartao">
          <div className="filtros">
            <div className="filtros-grupo">
              {[
                ['todos', 'Todos'],
                ['disponiveis', 'Disponíveis'],
                ['pendencia', 'Com pendência'],
              ].map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  className={filtro === valor ? 'chip chip-ativo' : 'chip'}
                  onClick={() => setFiltro(valor)}
                >
                  {texto}
                </button>
              ))}
            </div>

            <select
              className="filtro-especialidade"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              aria-label="Especialidade"
            >
              <option value="todas">Especialidade: todas</option>
              {especialidades.map((funcao) => (
                <option key={funcao} value={funcao}>
                  {capitalizar(funcao)}
                </option>
              ))}
            </select>
          </div>

          <table className="tabela">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Base</th>
                <th>Disponibilidade</th>
                <th>Certificações</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.id === selecionadoId
                      ? 'linha-clicavel linha-selecionada'
                      : 'linha-clicavel'
                  }
                  tabIndex={0}
                  onClick={() => setSelecionadoId(item.id)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') setSelecionadoId(item.id)
                  }}
                >
                  <td>
                    <div className="profissional">
                      <span
                        className={
                          item.disponibilidade.tipo === 'bloqueado'
                            ? 'avatar avatar-bloqueado'
                            : 'avatar'
                        }
                      >
                        {iniciais(item.nome)}
                      </span>
                      <div>
                        <strong>{item.nome}</strong>
                        <span className="tabela-detalhe">{item.cargo}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.base}</td>
                  <td>
                    <span className={`selo ${item.disponibilidade.classe}`}>
                      {item.disponibilidade.texto}
                    </span>
                  </td>
                  <td>
                    <span className={`certificacao certificacao-${item.certificacao.situacao}`}>
                      {item.certificacao.situacao === 'vencida' && <IconeFechar tamanho={16} />}
                      {item.certificacao.situacao === 'vencendo' && <IconeAlerta tamanho={16} />}
                      {item.certificacao.situacao === 'em-dia' && <IconeCheck tamanho={16} />}
                      {item.certificacao.texto}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visiveis.length === 0 && (
            <p className="pagina-apoio cartao-vazio">
              Nenhum profissional com esse filtro.
            </p>
          )}
        </section>

        {selecionado && (
          <aside className="cartao detalhe-profissional">
            <header className="detalhe-cabecalho">
              <span
                className={
                  selecionado.disponibilidade.tipo === 'bloqueado'
                    ? 'avatar avatar-grande avatar-bloqueado'
                    : 'avatar avatar-grande'
                }
              >
                {iniciais(selecionado.nome)}
              </span>
              <div className="detalhe-nome">
                <strong>{selecionado.nome}</strong>
                <span>
                  {selecionado.cargo} · {selecionado.base}
                </span>
              </div>
              <button
                type="button"
                className="janela-fechar"
                onClick={() => setSelecionadoId(null)}
                aria-label="Fechar detalhes"
              >
                <IconeFechar tamanho={22} />
              </button>
            </header>

            <div className="detalhe-corpo">
              {!detalhe && <p className="pagina-apoio">Carregando detalhes...</p>}

              {detalhe && (
                <>
                  {detalhe.aviso && (
                    <p
                      className={
                        detalhe.aviso.tipo === 'vencida'
                          ? 'detalhe-aviso detalhe-aviso-vencida'
                          : 'detalhe-aviso detalhe-aviso-vencendo'
                      }
                    >
                      {detalhe.aviso.tipo === 'vencida' && <IconeFechar tamanho={18} />}
                      <span>
                        {detalhe.aviso.destaque && <strong>{detalhe.aviso.destaque}</strong>}
                        {detalhe.aviso.resto}
                      </span>
                    </p>
                  )}

                  <h3 className="detalhe-titulo">Certificações</h3>
                  <ul className="detalhe-lista">
                    {detalhe.certificacoes.map((certificacao) => (
                      <li key={certificacao.nome}>
                        <span>{certificacao.nome}</span>
                        <span className={`selo selo-pequeno ${certificacao.classe}`}>
                          {certificacao.texto}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="detalhe-titulo">{detalhe.tituloServicos}</h3>
                  {detalhe.servicos.length === 0 ? (
                    <p className="pagina-apoio">Nenhum serviço alocado.</p>
                  ) : (
                    <ul className="detalhe-lista">
                      {detalhe.servicos.map((servico) => (
                        <li key={servico.rotulo}>
                          <span>{servico.rotulo}</span>
                          <span className="detalhe-data">{servico.data}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {detalhe.renovacao && (
                    <button type="button" className="botao-principal detalhe-botao">
                      Registrar renovação
                    </button>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

export default Profissionais
