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

// Documentos: a API ainda não tem status nem data completa (pendência registrada).
// Enquanto isso usamos dados de exemplo, no formato proposto para a API.
// Quando as rotas existirem, é só mudar USAR_MOCK para false.
const USAR_MOCK = true

const DOCUMENTOS_EXEMPLO = [
  {
    id: 'doc-001',
    codigo: 'PR-SOL-014',
    titulo: 'Reparo por solda em vasos de pressão',
    versao: '3',
    status: 'aprovado',
    aprovado_em: '2026-08-12',
    aplica_se_a: ['vaso de pressão', 'solda'],
    arquivo_url: '/documentos/doc-001/arquivo',
  },
  {
    id: 'doc-003',
    codigo: 'APR-ALT-005',
    titulo: 'APR · trabalho em altura',
    versao: '5',
    status: 'aprovado',
    aprovado_em: '2026-09-20',
    aplica_se_a: ['trabalho em altura'],
    arquivo_url: '/documentos/doc-003/arquivo',
  },
  {
    id: 'doc-002',
    codigo: 'MAN-V-301',
    titulo: 'Manual do vaso V-301',
    versao: '2',
    status: 'aprovado',
    aprovado_em: '2026-05-03',
    aplica_se_a: ['vaso V-301'],
    arquivo_url: '/documentos/doc-002/arquivo',
  },
  {
    id: 'doc-004',
    codigo: 'PR-ESP-021',
    titulo: 'Entrada em espaço confinado (NR-33)',
    versao: '1',
    status: 'rascunho',
    aprovado_em: null,
    aplica_se_a: ['espaço confinado'],
    arquivo_url: null,
  },
  {
    id: 'doc-005',
    codigo: 'PR-SOL-014',
    titulo: 'Reparo por solda em vasos de pressão',
    versao: '2',
    status: 'obsoleto',
    aprovado_em: '2025-01-15',
    aplica_se_a: ['vaso de pressão', 'solda'],
    arquivo_url: null,
  },
]

export async function buscarDocumentos() {
  // Devolve uma cópia: a tela guarda a lista no estado e não pode dividir o array.
  if (USAR_MOCK) return [...DOCUMENTOS_EXEMPLO]
  return chamarApi('/documentos')
}

// O PDF exige o token, então baixamos pela API e abrimos numa aba nova.
export async function abrirArquivoDoDocumento(arquivoUrl) {
  const arquivo = await chamarApi(arquivoUrl, { tipo: 'blob' })
  window.open(URL.createObjectURL(arquivo), '_blank')
}

// Usuários e auditoria também ainda não existem na API: dados de exemplo.
const USUARIOS_EXEMPLO = [
  { id: 'usr-001', nome: 'Marina Costa', email: 'marina.costa@empresa.com.br', perfil: 'gestor', ativo: true },
  { id: 'usr-002', nome: 'Ricardo Alves', email: 'ricardo.alves@empresa.com.br', perfil: 'administrador', ativo: true },
  { id: 'usr-003', nome: 'Paulo Souza', email: 'paulo.souza@empresa.com.br', perfil: 'tecnico', ativo: true },
  { id: 'usr-004', nome: 'Lucas Prado', email: 'lucas.prado@empresa.com.br', perfil: 'tecnico', ativo: false },
]

const AUDITORIA_EXEMPLO = [
  { id: 'aud-004', data_hora: '2026-10-22T14:32:00', ator: 'Ricardo', ator_tipo: 'usuario', acao: 'enviou', objeto: 'PR-ESP-021', versao: 'v1' },
  { id: 'aud-003', data_hora: '2026-09-20T10:05:00', ator: 'Marina', ator_tipo: 'usuario', acao: 'aprovou', objeto: 'APR-ALT-005', versao: 'v5' },
  { id: 'aud-002', data_hora: '2026-08-12T16:41:00', ator: 'Sistema', ator_tipo: 'sistema', acao: 'tornou obsoleto', objeto: 'PR-SOL-014', versao: 'v2' },
  { id: 'aud-001', data_hora: '2026-08-12T16:40:00', ator: 'Marina', ator_tipo: 'usuario', acao: 'aprovou', objeto: 'PR-SOL-014', versao: 'v3' },
]

export async function buscarUsuarios() {
  if (USAR_MOCK) return USUARIOS_EXEMPLO
  return chamarApi('/usuarios')
}

function registrarAuditoria(ator, acao, documento) {
  const agora = new Date()
  const dois = (numero) => String(numero).padStart(2, '0')
  AUDITORIA_EXEMPLO.push({
    id: `aud-${String(AUDITORIA_EXEMPLO.length + 1).padStart(3, '0')}`,
    data_hora: `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}T${dois(agora.getHours())}:${dois(agora.getMinutes())}:00`,
    ator,
    ator_tipo: 'usuario',
    acao,
    objeto: documento.codigo,
    versao: `v${documento.versao}`,
  })
}

// Envio simulado: não sobe o arquivo, só cria o documento e registra na auditoria.
// Com a API pronta, o POST recebe os mesmos campos.
export async function enviarDocumento(dados, ator) {
  if (!USAR_MOCK) {
    return chamarApi('/documentos', { metodo: 'POST', corpo: dados })
  }

  const documento = {
    id: `doc-${String(DOCUMENTOS_EXEMPLO.length + 1).padStart(3, '0')}`,
    codigo: dados.codigo,
    titulo: dados.titulo,
    versao: dados.versao,
    status: dados.status,
    aprovado_em: dados.status === 'aprovado' ? dados.data_aprovacao : null,
    aplica_se_a: dados.aplica_se_a,
    arquivo_url: null,
  }
  DOCUMENTOS_EXEMPLO.push(documento)

  registrarAuditoria(ator, 'enviou', documento)
  if (documento.status === 'aprovado') {
    registrarAuditoria(ator, 'aprovou', documento)
  }
  return documento
}

// Mais recente primeiro, como a API vai devolver.
export async function buscarAuditoria() {
  if (USAR_MOCK) {
    return [...AUDITORIA_EXEMPLO]
      .sort((a, b) => b.data_hora.localeCompare(a.data_hora))
      .slice(0, 4)
  }
  return chamarApi('/auditoria?limite=4')
}
