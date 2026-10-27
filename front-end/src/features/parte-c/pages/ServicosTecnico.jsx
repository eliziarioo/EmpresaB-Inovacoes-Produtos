import Icone from "../components/Icone.jsx";
export default function ServicosTecnico({ servicos, aoSelecionar }) {
  return (
    <main className="tc-rolagem tc-listagem">
      {["proximos", "concluidos"].map((grupo) => {
        const itens = servicos.filter(
          (s) => (s.estado === "concluida") === (grupo === "concluidos"),
        );
        return (
          <section className="tc-grupo-servicos" key={grupo}>
            <h2 className="tc-rotulo">
              {grupo === "proximos" ? "Próximos" : "Concluídos"}
            </h2>
            {itens.length ? (
              itens.map((s, i) => {
                const principal = grupo === "proximos" && i === 0;
                const concluido = grupo === "concluidos";
                return (
                  <button
                    key={s.ordem_id}
                    className={`tc-cartao tc-servico-lista ${principal ? "tc-servico-destaque" : ""}`}
                    onClick={() => aoSelecionar(s)}
                  >
                    <span className="tc-linha">
                      <span className="tc-codigo">{s.ordem_id}</span>
                      <span
                        className={`tc-selo ${concluido ? "tc-selo-verde" : principal ? "tc-selo-laranja" : ""}`}
                      >
                        <Icone
                          id={
                            concluido
                              ? "289-118-imgGroup5"
                              : principal
                                ? "289-118-imgGroup"
                                : "289-118-imgGroup4"
                          }
                          tamanho={13}
                        />
                        {s.selo || s.estado_rotulo || "Agendado"}
                      </span>
                    </span>
                    <span className="tc-servico-corpo">
                      <span className="tc-servico-descricao">
                        <strong>{s.titulo}</strong>
                        <span>
                          <Icone id="289-118-imgGroup1" tamanho={14} />
                          {s.local || s.local_detalhe}
                        </span>
                        <span>
                          <Icone id="289-118-imgGroup2" tamanho={14} />
                          {s.data_funcao || s.prazo_texto}
                        </span>
                      </span>
                      <Icone id="289-118-imgGroup3" tamanho={18} />
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="tc-texto-suave">
                Nenhum serviço {grupo === "proximos" ? "agendado" : "concluído"}
                .
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}
