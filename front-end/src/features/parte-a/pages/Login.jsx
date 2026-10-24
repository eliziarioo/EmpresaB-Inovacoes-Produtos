import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth.js'
import '../parteA.css'

const DESTAQUES = [
  'Recomendação de equipe com justificativa',
  'Certificações conferidas antes da escala',
  'Aprovação sempre feita por uma pessoa',
]

const PERFIS = [
  { tipo: 'gestor', rotulo: 'Gestor', exemplo: 'marina@empresa.com.br' },
  { tipo: 'tecnico', rotulo: 'Técnico', exemplo: 'paulo@empresa.com.br' },
  { tipo: 'administrador', rotulo: 'Administrador', exemplo: 'ricardo@empresa.com.br' },
]

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Login() {
  const { perfil, entrar } = useAuth()
  const navegar = useNavigate()
  const [tipo, setTipo] = useState('gestor')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (perfil) return <Navigate to={perfil.tela_inicial} replace />

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const logado = await entrar(email, senha, lembrar, tipo)
      navegar(logado.tela_inicial, { replace: true })
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <section className="login-lado">
        <div className="login-marca">
          <span className="login-logo" aria-hidden="true">
            iA
          </span>
          <span>INTELLIGENT TEAM</span>
        </div>

        <div className="login-texto">
          <h1>Equipes habilitadas para cada ordem de serviço.</h1>
          <ul>
            {DESTAQUES.map((texto) => (
              <li key={texto}>
                <span className="login-check">
                  <IconeCheck />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="login-rodape">Intelligent Team</p>
      </section>

      <section className="login-area">
        <form className="login-cartao" onSubmit={aoEnviar}>
          <h2>Entrar na plataforma</h2>

          <div className="login-perfis" role="radiogroup" aria-label="Entrar como">
            <p className="login-perfis-titulo">Entrar como...</p>
            <div className="login-perfis-opcoes">
              {PERFIS.map((opcao) => (
                <button
                  key={opcao.tipo}
                  type="button"
                  role="radio"
                  aria-checked={tipo === opcao.tipo}
                  className={
                    tipo === opcao.tipo
                      ? 'login-perfil login-perfil-ativo'
                      : 'login-perfil'
                  }
                  onClick={() => setTipo(opcao.tipo)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          <label className="campo">
            <span>E-mail corporativo</span>
            <input
              type="text"
              autoComplete="username"
              placeholder={PERFIS.find((p) => p.tipo === tipo).exemplo}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="campo">
            <span>Senha</span>
            <div className="campo-senha">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                className="campo-olho"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <div className="login-linha">
            <label className="login-lembrar">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              Lembrar de mim
            </label>
            <button type="button" className="link">
              Esqueci minha senha
            </button>
          </div>

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="botao-principal" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default Login
