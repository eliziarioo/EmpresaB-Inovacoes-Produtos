import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Login from '../features/parte-a/pages/Login.jsx'
import Painel from '../features/parte-a/pages/Painel.jsx'
import Documentos from '../features/parte-a/pages/Documentos.jsx'
import RotaProtegida from './RotaProtegida.jsx'

const PERFIS_GESTAO = ['gestor', 'administrador']

function EmBreve({ titulo }) {
  return (
    <>
      <h1 className="pagina-titulo">{titulo}</h1>
      <p className="pagina-apoio">Esta tela será ligada pelo grupo.</p>
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida perfis={PERFIS_GESTAO} />}>
        <Route element={<Layout />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/ordens" element={<EmBreve titulo="Ordens de serviço" />} />
          <Route
            path="/profissionais"
            element={<EmBreve titulo="Profissionais" />}
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/painel" replace />} />
      <Route path="*" element={<p>Página não encontrada.</p>} />
    </Routes>
  )
}

export default AppRoutes
