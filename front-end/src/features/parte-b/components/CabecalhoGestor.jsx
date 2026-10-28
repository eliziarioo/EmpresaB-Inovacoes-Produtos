
export default function CabecalhoGestor({ onAbrirOrdens }) {
  return (
    <header className="gestor-menu-superior">
      <div className="gestor-menu-marca">
        <img
          src="/logo-intelligent-team.png"
          alt=""
          className="gestor-menu-logo"
        />

        <strong>
          INTELLIGENT <span className="gestor-menu-destaque">TEAM</span>
        </strong>
      </div>

      <nav
        className="gestor-menu-navegacao"
        aria-label="Navegação principal"
      >
        <button
          type="button"
          className="gestor-menu-botao"
        >
          Painel
        </button>

        <button
          type="button"
          className="gestor-menu-botao gestor-menu-ativo"
          onClick={onAbrirOrdens}
          aria-current="page"
        >
          Ordens de serviço
        </button>

        <button
          type="button"
          className="gestor-menu-botao"
        >
          Profissionais
        </button>

        <button
          type="button"
          className="gestor-menu-botao"
        >
          Documentos
        </button>
      </nav>

      <div className="gestor-menu-usuario">
        <div className="gestor-menu-avatar">
          MC
        </div>

        <div className="gestor-menu-usuario-info">
          <strong>Marina Costa</strong>
          <span>Gestora de operações</span>
        </div>
      </div>
    </header>
  );
}
