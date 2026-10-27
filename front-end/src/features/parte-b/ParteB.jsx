
import { useState } from "react";

import CabecalhoGestor from "./components/CabecalhoGestor";
import LeituraOrdem from "./pages/LeituraOrdem";
import EquipeRecomendada from "./pages/EquipeRecomendada";

export default function ParteB() {
  const [ordem, setOrdem] = useState(null);
  const [resultado, setResultado] = useState(null);

  function mostrarEquipe(ordemAtual, dados) {
    setOrdem(ordemAtual);
    setResultado(dados);
  }

  function voltarParaOrdem() {
    setResultado(null);
  }

  return (
    <div className="gestor-parte-b">
      <CabecalhoGestor
        onAbrirOrdens={voltarParaOrdem}
      />

      {resultado ? (
        <EquipeRecomendada
          ordem={ordem}
          resultado={resultado}
          onVoltar={voltarParaOrdem}
        />
      ) : (
        <LeituraOrdem
          onAnaliseConcluida={mostrarEquipe}
        />
      )}
    </div>
  );
}
