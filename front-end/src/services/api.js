const URL_BASE = 'http://127.0.0.1:8000'
const CHAVE_TOKEN = 'it_token'

// "Lembrar de mim" guarda em localStorage; sem ele, só até fechar a aba.
export function lerToken() {
  return (
    localStorage.getItem(CHAVE_TOKEN) || sessionStorage.getItem(CHAVE_TOKEN)
  )
}

export function guardarToken(token, lembrar) {
  limparToken()
  const destino = lembrar ? localStorage : sessionStorage
  destino.setItem(CHAVE_TOKEN, token)
}

export function limparToken() {
  localStorage.removeItem(CHAVE_TOKEN)
  sessionStorage.removeItem(CHAVE_TOKEN)
}

// O AuthContext registra aqui o que fazer quando a API responde 401.
let aoExpirar = () => {}

export function definirAoExpirar(funcao) {
  aoExpirar = funcao
}

export async function chamarApi(caminho, opcoes = {}) {
  const { metodo = 'GET', corpo, tipo = 'json' } = opcoes
  const token = lerToken()
  const cabecalhos = {}

  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  if (token) cabecalhos.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new Error('Não foi possível falar com a API. Ela está ligada?')
  }

  // 401 com token enviado = sessão caiu (a API reiniciou): volta ao login.
  // 401 sem token é só senha errada, e quem chamou trata a mensagem.
  if (resposta.status === 401 && token) {
    limparToken()
    aoExpirar()
  }

  if (!resposta.ok) {
    let mensagem = 'Algo deu errado. Tente de novo.'
    try {
      const dados = await resposta.json()
      if (dados.detail) mensagem = dados.detail
    } catch {
      // resposta sem JSON: fica a mensagem padrão
    }
    throw new Error(mensagem)
  }

  return tipo === 'blob' ? resposta.blob() : resposta.json()
}
