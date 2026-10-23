
import { useEffect, useState } from "react";
import { aprovarEquipe } from "../services/gestorService";

export default function ModalAprovacao({
  ordem,
  onFechar,
  onAprovado
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function fecharComEscape(event) {
      if (event.key === "Escape" && !carregando) {
        onFechar();
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [onFechar, carregando]);

  async function confirmarAprovacao() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await aprovarEquipe(ordem.id);

      if (resposta.sucesso) {
        onAprovado();
      } else {
        setErro("Não foi possível aprovar a equipe.");
      }
    } catch {
      setErro("Erro ao aprovar a equipe.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="gestor-modal-fundo">
      <div
        className="gestor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-aprovacao"
      >
        <h2 id="titulo-modal-aprovacao">
          Confirmar aprovação
        </h2>

        <p>
          Deseja realmente aprovar a equipe
          recomendada para a ordem
          <strong> {ordem.id}</strong>?
        </p>

        {erro && (
          <p className="gestor-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="gestor-acoes">
          <button
            type="button"
            className="gestor-botao-secundario"
            onClick={onFechar}
            disabled={carregando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="gestor-botao"
            onClick={confirmarAprovacao}
            disabled={carregando}
          >
            {carregando
              ? "Aprovando..."
              : "Confirmar aprovação"}
          </button>
        </div>
      </div>
    </div>
  );
}
