import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconeAlerta,
  IconeBloqueio,
  IconeCheck,
  IconeCheckCirculo,
  IconePlay,
  IconeRelogio,
} from '../components/Icones.jsx'
import {
  buscarAlertas,
  buscarOrdens,
  buscarPainel,
} from '../services/adminService.js'
import '../parteA.css'

const ESTADOS = {
  aguardando_aprovacao: {
    texto: 'Aguardando aprovação',
    classe: 'selo-atencao',
    Icone: IconeRelogio,
  },
  sem_profissional_elegivel: {
    texto: 'Sem profissional elegível',
    classe: 'selo-bloqueio',
    Icone: IconeBloqueio,
  },
  equipe_aprovada: {
    texto: 'Equipe aprovada',
    classe: 'selo-principal',
    Icone: IconeCheck,
  },
  em_execucao: {
    texto: 'Em execução',
    classe: 'selo-neutro',
    Icone: IconePlay,
  },
  concluida: {
    texto: 'Concluída',
    classe: 'selo-contorno',
    Icone: IconeCheckCirculo,
  },
}

const ICONES_ALERTA = {
  bloqueio: IconeBloqueio,
  sem_profissional_elegivel: IconeBloqueio,
  conflito_agenda: IconeAlerta,
  vencimento_proximo: IconeRelogio,
}

function formatarPrazo(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function formatarDia(iso) {
  const data = new Date(`${iso}T12:00:00`)
  const diaDaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
    .format(data)
    .split('-')[0]
  const diaEMes = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(data)
  return `${diaDaSemana.charAt(0).toUpperCase()}${diaDaSemana.slice(1)}, ${diaEMes}`
}

function capitalizar(texto) {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`
}

function Painel() {
  const [painel, setPainel] = useState(null)
  const [ordens, setOrdens] = useState([])
  const [alertas, setAlertas] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    Promise.all([buscarPainel(), buscarOrdens(), buscarAlertas()])
      .then(([dadosPainel, dadosOrdens, dadosAlertas]) => {
        if (!ativo) return
        setPainel(dadosPainel)
        setOrdens(dadosOrdens)
        setAlertas(dadosAlertas)
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })

    return () => {
      ativo = false
    }
  }, [])

  if (erro) {
    return (
      <p className="login-erro" role="alert">
        {erro}
      </p>
    )
  }

  if (!painel) return <p className="pagina-apoio">Carregando painel...</p>

  const { contadores } = painel
  const precisamAtencao = contadores.aguardando_aprovacao
  const disponiveis = contadores.profissionais_disponiveis

  return (
    <>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Painel de operações</h1>
          <p className="pagina-apoio">
            {formatarDia(painel.data_referencia)} · {precisamAtencao}{' '}
            {precisamAtencao === 1
              ? 'ordem de serviço precisa'
              : 'ordens de serviço precisam'}{' '}
            da sua atenção
          </p>
        </div>
        <Link to="/ordens" className="botao-principal botao-auto">
          + Nova ordem de serviço
        </Link>
      </div>

      <section className="contadores" aria-label="Resumo">
        <div className="contador">
          <span>OS abertas</span>
          <strong>{contadores.os_abertas}</strong>
        </div>
        <div className="contador">
          <span>Aguardando aprovação de equipe</span>
          <strong>{contadores.aguardando_aprovacao}</strong>
        </div>
        <div className="contador">
          <span>Em execução</span>
          <strong>{contadores.em_execucao}</strong>
        </div>
        <div className="contador contador-alerta">
          <span>Alertas ativos</span>
          <strong>{contadores.alertas_ativos}</strong>
        </div>
      </section>

      <div className="painel-colunas">
        <section className="cartao">
          <header className="cartao-cabecalho">
            <h2>Ordens de serviço</h2>
            <span>Ordenadas por prazo</span>
          </header>
          <table className="tabela">
            <thead>
              <tr>
                <th>OS</th>
                <th>Serviço</th>
                <th>Local</th>
                <th>Prazo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((ordem) => {
                const estado = ESTADOS[ordem.estado]
                const destaque = ordem.estado === 'aguardando_aprovacao'
                return (
                  <tr key={ordem.id} className={destaque ? 'linha-destaque' : ''}>
                    <td className="codigo">{ordem.id}</td>
                    <td>
                      <strong>{ordem.servico}</strong>
                      <span className="tabela-detalhe">{ordem.resumo_equipe}</span>
                    </td>
                    <td>
                      {ordem.local}
                      <span className="tabela-detalhe">
                        {capitalizar(ordem.ambiente)}
                      </span>
                    </td>
                    <td className={destaque ? 'prazo prazo-destaque' : 'prazo'}>
                      {formatarPrazo(ordem.prazo)}
                    </td>
                    <td>
                      {estado && (
                        <span className={`selo ${estado.classe}`}>
                          <estado.Icone />
                          {estado.texto}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <aside className="painel-lateral">
          <section className="cartao">
            <header className="cartao-cabecalho">
              <h2 className="titulo-laranja">Alertas</h2>
            </header>
            <ul className="alertas">
              {alertas.map((alerta, indice) => {
                const Icone = ICONES_ALERTA[alerta.tipo] || IconeAlerta
                return (
                  <li
                    key={`${alerta.tipo}-${indice}`}
                    className={
                      alerta.gravidade === 'critica'
                        ? 'alerta alerta-critico'
                        : 'alerta alerta-atencao'
                    }
                  >
                    <Icone tamanho={22} />
                    <div>
                      <strong>{alerta.titulo}</strong>
                      <p>{alerta.mensagem}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="cartao">
            <header className="cartao-cabecalho cartao-cabecalho-coluna">
              <h2>Profissionais disponíveis</h2>
              <span>{disponiveis.semana}</span>
            </header>
            <ul className="disponiveis">
              {disponiveis.por_funcao.map((grupo) => (
                <li key={grupo.funcao}>
                  <div className="disponiveis-linha">
                    <span>{grupo.rotulo}</span>
                    <span>
                      {grupo.disponiveis} de {grupo.total}
                    </span>
                  </div>
                  <div className="barra">
                    <div
                      className="barra-cheia"
                      style={{ width: `${(grupo.disponiveis / grupo.total) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}

export default Painel
