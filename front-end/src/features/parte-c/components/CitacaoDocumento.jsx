export default function CitacaoDocumento({ citacao }) {
  return (
    <blockquote className="tc-citacao">
      <strong>
        {citacao.codigo}{" "}
        {String(citacao.versao).startsWith("revis")
          ? citacao.versao
          : `v${citacao.versao}`}{" "}
        · seção {citacao.secao} · página {citacao.pagina}
      </strong>
      <p>“{citacao.trecho}”</p>
    </blockquote>
  );
}
