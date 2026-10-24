import { chamarApi } from '../../../services/api.js'

// Painel do gestor: tudo vem da API (contadores, ordens e alertas).
export function buscarPainel() {
  return chamarApi('/painel')
}

export function buscarOrdens() {
  return chamarApi('/ordens?ordenar=prazo')
}

export function buscarAlertas() {
  return chamarApi('/alertas')
}
