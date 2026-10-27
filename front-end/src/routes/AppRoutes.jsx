import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Login from '../features/parte-a/pages/Login.jsx'
import Painel from '../features/parte-a/pages/Painel.jsx'
import Documentos from '../features/parte-a/pages/Documentos.jsx'
import Profissionais from '../features/parte-a/pages/Profissionais.jsx'
import AppTecnico from './AppTecnico.jsx'
import OrdensGestor from './OrdensGestor.jsx'
import RotaProtegida from './RotaProtegida.jsx'

const PERFIS_GESTAO = ['gestor', 'administrador']
const PERFIS_TECNICO = ['tecnico']

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida perfis={PERFIS_GESTAO} />}>
        <Route element={<Layout />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/ordens" element={<OrdensGestor />} />
          <Route path="/profissionais" element={<Profissionais />} />
        </Route>
      </Route>

      <Route element={<RotaProtegida perfis={PERFIS_TECNICO} />}>
        <Route path="/profissionais/:id/servicos" element={<AppTecnico />} />
      </Route>

      <Route path="/" element={<Navigate to="/painel" replace />} />
      <Route path="*" element={<p>Página não encontrada.</p>} />
    </Routes>
  )
}

export default AppRoutes
