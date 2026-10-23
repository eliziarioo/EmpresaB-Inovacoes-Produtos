import { chamarApi, guardarToken, limparToken } from '../../../services/api.js'

const CHAVE_PERFIL = 'it_perfil'

// A API ainda não tem o perfil administrador (pendência registrada).
// Enquanto isso, Ricardo entra com a sessão da gestora e o front troca o perfil.
const ADMIN_DEMO = {
  usuario: 'ricardo',
  senha: 'admin123',
  perfil: {
    id: 'administrador',
    tipo: 'administrador',
    nome: 'Ricardo Alves',
    cargo: 'Administrador',
    iniciais: 'RA',
    tela_inicial: '/painel',
  },
}

function guardarPerfil(perfil, lembrar) {
  const destino = lembrar ? localStorage : sessionStorage
  localStorage.removeItem(CHAVE_PERFIL)
  sessionStorage.removeItem(CHAVE_PERFIL)
  destino.setItem(CHAVE_PERFIL, JSON.stringify(perfil))
}

export function lerPerfilGuardado() {
  const texto =
    localStorage.getItem(CHAVE_PERFIL) || sessionStorage.getItem(CHAVE_PERFIL)
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

// A tela pede e-mail, mas a API entra por "usuário": usamos o que vem antes do @.
export async function entrar(email, senha, lembrar, tipoEsperado) {
  const usuario = email.trim().split('@')[0].toLowerCase()
  const ehAdmin = usuario === ADMIN_DEMO.usuario

  if (ehAdmin && senha !== ADMIN_DEMO.senha) {
    throw new Error('Usuário ou senha incorretos.')
  }

  const dados = await chamarApi('/entrar', {
    metodo: 'POST',
    corpo: ehAdmin
      ? { usuario: 'marina', senha: 'gestor123' }
      : { usuario, senha },
  })

  const perfil = ehAdmin ? ADMIN_DEMO.perfil : dados.perfil

  // "Entrar como...": o perfil escolhido tem que ser o do usuário que entrou.
  if (tipoEsperado && perfil.tipo !== tipoEsperado) {
    throw new Error('Este usuário não tem o perfil selecionado.')
  }

  guardarToken(dados.token, lembrar)
  guardarPerfil(perfil, lembrar)
  return perfil
}

export async function sair() {
  try {
    await chamarApi('/sair', { metodo: 'POST' })
  } catch {
    // se a API já não conhece o token, saímos do mesmo jeito
  }
  limparToken()
  localStorage.removeItem(CHAVE_PERFIL)
  sessionStorage.removeItem(CHAVE_PERFIL)
}
