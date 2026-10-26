const URL_BASE = 'http://127.0.0.1:8000'
const CHAVE_TOKEN = 'it_token'

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

let aoExpirar = () => {}

export function definirAoExpirar(funcao) {
  aoExpirar = funcao
}

// A API responde {"detail": "..."} ou, nos erros de campo, {"campo": ["mensagem"]}.
function extrairMensagem(dados) {
  if (dados.detail) return dados.detail
  const textos = Object.values(dados)
    .flat()
    .filter((texto) => typeof texto === 'string')
  return textos.length ? textos.join(' ') : 'Algo deu errado. Tente de novo.'
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

  if (resposta.status === 401 && token) {
    limparToken()
    aoExpirar()
  }

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}))
    throw new Error(extrairMensagem(dados))
  }

  return tipo === 'blob' ? resposta.blob() : resposta.json()
}
