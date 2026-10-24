import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import './Layout.css'

const ABAS = [
  { para: '/painel', texto: 'Painel' },
  { para: '/ordens', texto: 'Ordens de serviço' },
  { para: '/profissionais', texto: 'Profissionais' },
  { para: '/documentos', texto: 'Documentos' },
]

function Layout() {
  const { perfil, sair } = useAuth()

  return (
    <>
      <header className="topo">
        <div className="topo-marca">
          <span className="topo-logo" aria-hidden="true">
            iA
          </span>
          <span className="topo-nome">INTELLIGENT TEAM</span>
        </div>

        <nav className="topo-abas" aria-label="Principal">
          {ABAS.map((aba) => (
            <NavLink
              key={aba.para}
              to={aba.para}
              className={({ isActive }) =>
                isActive ? 'topo-aba topo-aba-ativa' : 'topo-aba'
              }
            >
              {aba.texto}
            </NavLink>
          ))}
        </nav>

        <div className="topo-usuario">
          <span className="topo-iniciais">{perfil.iniciais}</span>
          <div className="topo-dados">
            <strong>{perfil.nome}</strong>
            <span>{perfil.cargo}</span>
          </div>
          <button type="button" className="topo-sair" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <main className="pagina">
        <Outlet />
      </main>
    </>
  )
}

export default Layout
