
import { useState } from "react";
import ModalAprovacao from "../components/ModalAprovacao";

export default function EquipeRecomendada({
  ordem,
  resultado,
  onVoltar
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [aprovado, setAprovado] = useState(false);

  return (
    <main className="gestor-container">
      <div className="gestor-topo">
        <button
          type="button"
          className="gestor-voltar"
          onClick={onVoltar}
        >
          ← Voltar para a ordem
        </button>

        <span className="gestor-etiqueta">
          {ordem.id}
        </span>

        <h1>Equipe recomendada</h1>
        <p>
          Confira os profissionais sugeridos
          para a execução do serviço.
        </p>
      </div>

      <section className="gestor-card">
        <h2>{ordem.titulo}</h2>

        <div className="gestor-justificativa">
          <strong>Justificativa da recomendação</strong>
          <p>{resultado.justificativa}</p>
        </div>

        <h3>Profissionais recomendados</h3>

        <div className="gestor-lista">
          {resultado.equipe.map((profissional) => (
            <article
              className="gestor-profissional"
              key={profissional.id}
            >
              <div>
                <h4>{profissional.nome}</h4>
                <p>{profissional.cargo}</p>

                <div className="gestor-certificacoes">
                  {profissional.certificacoes.map(
                    (certificacao) => (
                      <span key={certificacao}>
                        {certificacao}
                      </span>
                    )
                  )}
                </div>
              </div>

              <span className="gestor-disponibilidade">
                {profissional.disponivel
                  ? "Disponível"
                  : "Indisponível"}
              </span>
            </article>
          ))}
        </div>

        <div className="gestor-acoes">
          {aprovado ? (
            <p className="gestor-sucesso" role="status">
              Equipe aprovada com sucesso!
            </p>
          ) : (
            <button
              type="button"
              className="gestor-botao"
              onClick={() => setModalAberto(true)}
            >
              Aprovar equipe
            </button>
          )}
        </div>
      </section>

      {modalAberto && (
        <ModalAprovacao
          ordem={ordem}
          onFechar={() => setModalAberto(false)}
          onAprovado={() => {
            setAprovado(true);
            setModalAberto(false);
          }}
        />
      )}
    </main>
  );
}
