import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo.svg'
import { useAuth } from '../context/useAuth.js'
import './Layout.css'

const ABAS = [
  { para: '/painel', texto: 'Painel' },
  { para: '/ordens', texto: 'Ordens de serviço', soGestor: true },
  { para: '/profissionais', texto: 'Profissionais' },
  { para: '/documentos', texto: 'Documentos' },
]

function Layout() {
  const { perfil, sair } = useAuth()

  return (
    <>
      <header className="topo">
        <div className="topo-marca">
          <img src={logo} alt="" className="topo-logo" />
          <span className="topo-nome">
            INTELLIGENT <span className="destaque-laranja">TEAM</span>
          </span>
        </div>

        <nav className="topo-abas" aria-label="Principal">
          {ABAS.filter(
            (aba) => !aba.soGestor || perfil.tipo === 'gestor',
          ).map((aba) => (
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
