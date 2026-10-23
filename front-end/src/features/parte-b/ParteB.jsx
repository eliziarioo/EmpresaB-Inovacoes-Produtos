
import { useState } from "react";
import LeituraOrdem from "./pages/LeituraOrdem";
import EquipeRecomendada from "./pages/EquipeRecomendada";

export default function ParteB() {
  const [resultado, setResultado] = useState(null);
  const [ordem, setOrdem] = useState(null);

  function mostrarEquipe(ordemSelecionada, analise) {
    setOrdem(ordemSelecionada);
    setResultado(analise);
  }

  function voltarParaOrdem() {
    setResultado(null);
  }

  if (resultado && ordem) {
    return (
      <EquipeRecomendada
        ordem={ordem}
        resultado={resultado}
        onVoltar={voltarParaOrdem}
      />
    );
  }

  return <LeituraOrdem onAnaliseConcluida={mostrarEquipe} />;
}
