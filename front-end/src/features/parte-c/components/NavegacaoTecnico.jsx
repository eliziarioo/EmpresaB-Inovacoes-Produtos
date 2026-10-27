import Icone from "./Icone.jsx";
export default function NavegacaoTecnico({ ativa, aoNavegar }) {
  const ids =
    ativa === "servicos"
      ? ["289-118-imgGroup6", "289-118-imgGroup7", "289-118-imgGroup8"]
      : ativa === "documentos"
        ? ["286-118-imgGroup4", "286-118-imgGroup5", "286-118-imgGroup6"]
        : ["6-112-imgGroup7", "6-112-imgGroup8", "6-112-imgGroup9"];
  return (
    <nav
      className={`tc-nav tc-nav--${ativa}`}
      aria-label="Navegação do técnico"
    >
      {["inicio", "servicos", "documentos", "assistente"].map((id, i) => (
        <button
          key={id}
          onClick={() => aoNavegar(id)}
          aria-current={ativa === id ? "page" : undefined}
        >
          <Icone id={ids[i] || "6-112-imgLogo"} tamanho={22} logo={i === 3} />
          <span>{["Início", "Serviços", "Documentos", "Assistente"][i]}</span>
        </button>
      ))}
    </nav>
  );
}
