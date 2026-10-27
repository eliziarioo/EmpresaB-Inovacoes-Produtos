export default function CabecalhoTecnico({ apoio, titulo, perfil, aoPerfil }) {
  return (
    <header className="tc-cabecalho">
      <div>
        <p>{apoio}</p>
        <h1>{titulo}</h1>
      </div>
      <button
        className="tc-avatar"
        aria-label="Abrir perfil"
        onClick={aoPerfil}
      >
        {perfil.iniciais}
      </button>
    </header>
  );
}
