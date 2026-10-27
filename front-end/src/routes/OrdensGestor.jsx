import { useState } from 'react'
import EquipeRecomendada from '../features/parte-b/pages/EquipeRecomendada.jsx'
import LeituraOrdem from '../features/parte-b/pages/LeituraOrdem.jsx'

function OrdensGestor() {
  const [ordem, setOrdem] = useState(null)
  const [resultado, setResultado] = useState(null)

  function mostrarEquipe(ordemAtual, dados) {
    setOrdem(ordemAtual)
    setResultado(dados)
  }

  function voltarParaOrdem() {
    setResultado(null)
  }

  if (resultado) {
    return (
      <EquipeRecomendada
        ordem={ordem}
        resultado={resultado}
        onVoltar={voltarParaOrdem}
      />
    )
  }

  return <LeituraOrdem onAnaliseConcluida={mostrarEquipe} />
}

export default OrdensGestor
