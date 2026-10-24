import { useEffect, useState } from 'react'
import { definirAoExpirar } from '../services/api.js'
import {
  entrar as entrarNaApi,
  lerPerfilGuardado,
  sair as sairDaApi,
} from '../features/parte-a/services/authService.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(lerPerfilGuardado)

  // Se a API devolver 401, esquecemos o perfil e as rotas mandam para o login.
  useEffect(() => {
    definirAoExpirar(() => setPerfil(null))
  }, [])

  async function entrar(email, senha, lembrar, tipoEsperado) {
    const perfilLogado = await entrarNaApi(email, senha, lembrar, tipoEsperado)
    setPerfil(perfilLogado)
    return perfilLogado
  }

  async function sair() {
    await sairDaApi()
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ perfil, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}
