import Icone from "../components/Icone.jsx";
export default function InicioTecnico({
  servico,
  documentos,
  seguinte,
  aoAssistente,
}) {
  if (!servico)
    return (
      <main className="tc-rolagem">
        <div className="tc-cartao tc-vazio">
          <h2>Nenhum serviço confirmado</h2>
          <p>Seu serviço aparecerá após a aprovação da equipe.</p>
        </div>
      </main>
    );
  return (
    <>
      <main className="tc-rolagem tc-inicio" key={servico.ordem_id}>
        {!!servico.avisos?.length && (
          <section className="tc-avisos" aria-label="Avisos do serviço">
            {servico.avisos.map((a) => {
              const [titulo, ...resto] = a.mensagem.split(" · ");
              return (
                <div
                  key={a.mensagem}
                  className={`tc-aviso ${a.tipo === "confirmado" ? "tc-aviso-ok" : "tc-aviso-atencao"}`}
                >
                  <Icone
                    id={
                      a.tipo === "confirmado"
                        ? "6-112-imgGroup"
                        : "6-112-imgGroup1"
                    }
                  />
                  <p>
                    <strong>{titulo}</strong>
                    <span>{resto.length ? " · " + resto.join(" · ") : ""}</span>
                  </p>
                </div>
              );
            })}
          </section>
        )}
        <section className="tc-cartao tc-servico-principal">
          <div className="tc-linha">
            <span className="tc-rotulo">Seu próximo serviço</span>
            <span className="tc-codigo">{servico.ordem_id}</span>
          </div>
          <h2>{servico.titulo}</h2>
          <ul className="tc-detalhes">
            <li>
              <Icone id="6-112-imgGroup2" tamanho={16} />
              {servico.local_detalhe || servico.local}
            </li>
            {servico.prazo_texto && (
              <li>
                <Icone id="6-112-imgGroup3" tamanho={16} />
                Prazo: {servico.prazo_texto}
              </li>
            )}
            {servico.equipe_texto && (
              <li>
                <Icone id="6-112-imgGroup4" tamanho={16} />
                Equipe: {servico.equipe_texto}
              </li>
            )}
          </ul>
          {servico.sua_funcao && (
            <p className="tc-funcao">
              <strong>Sua função:</strong><span> {servico.sua_funcao}</span>
            </p>
          )}
        </section>
        <section className="tc-cartao tc-documentos-inicio">
          <h2 className="tc-rotulo">Documentos deste serviço</h2>
          {documentos.length ? (
            documentos.map((d) => (
              <button key={d.id} onClick={() => aoAssistente(d.id)}>
                <Icone id="6-112-imgGroup5" tamanho={20} />
                <span>
                  <strong>{d.titulo_inicio || d.titulo}</strong>
                  <small>{d.descricao_curta || `Versão ${d.versao}`}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="tc-vazio">Nenhum documento autorizado.</p>
          )}
        </section>
        {seguinte && (
          <p className="tc-depois">
            Depois: {seguinte.ordem_id} ·{" "}
            {seguinte.titulo.toLocaleLowerCase("pt-BR")} ·{" "}
            {seguinte.prazo_texto}
          </p>
        )}
      </main>
      <div className="tc-acao-fixa">
        <button className="tc-primario" onClick={() => aoAssistente()}>
          <Icone id="6-112-imgGroup6" tamanho={20} />
          Perguntar ao assistente
        </button>
      </div>
    </>
  );
}
