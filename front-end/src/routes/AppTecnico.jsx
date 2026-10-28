import { useAuth } from '../context/useAuth.js'
import TecnicoApp from '../features/parte-c/TecnicoApp.jsx'

function AppTecnico() {
  const { perfil, sair } = useAuth()

  return <TecnicoApp modo="api" perfil={perfil} aoSair={sair} />
}

export default AppTecnico
