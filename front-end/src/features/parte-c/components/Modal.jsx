import { useEffect, useRef } from "react";
import Icone from "./Icone.jsx";

export default function Modal({
  titulo,
  children,
  aoFechar,
  classe = "",
  rotulo,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`tc-modal ${classe}`}
      onCancel={aoFechar}
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
      aria-label={rotulo || titulo}
    >
      {titulo && (
        <div className="tc-modal-topo">
          <h2>{titulo}</h2>
          <button
            type="button"
            className="tc-icone-botao"
            aria-label="Fechar"
            onClick={aoFechar}
          >
            <Icone id="286-226-imgGroup" tamanho={20} />
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}
