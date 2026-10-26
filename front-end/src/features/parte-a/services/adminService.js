import { chamarApi } from '../../../services/api.js'

export function buscarPainel() {
  return chamarApi('/painel')
}

export function buscarOrdens() {
  return chamarApi('/ordens?ordenar=prazo')
}

export function buscarAlertas() {
  return chamarApi('/alertas')
}

export function buscarDocumentos() {
  return chamarApi('/documentos')
}

export function enviarDocumento(dados) {
  return chamarApi('/documentos', { metodo: 'POST', corpo: dados })
}

export async function abrirArquivoDoDocumento(arquivoUrl) {
  const arquivo = await chamarApi(arquivoUrl, { tipo: 'blob' })
  window.open(URL.createObjectURL(arquivo), '_blank')
}

export function buscarUsuarios() {
  return chamarApi('/usuarios')
}

export function buscarAuditoria() {
  return chamarApi('/auditoria?limite=4')
}
