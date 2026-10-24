import { createContext, useContext } from 'react'

// Fica fora do AuthContext.jsx para aquele arquivo exportar só o componente.
export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}
