import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// Sem login vai para /login; com login mas perfil errado, volta à tela do perfil.
function RotaProtegida({ perfis }) {
  const { perfil } = useAuth()
  const local = useLocation()

  if (!perfil) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />
  }

  if (!perfis.includes(perfil.tipo)) {
    return <Navigate to={perfil.tela_inicial} replace />
  }

  return <Outlet />
}

export default RotaProtegida
