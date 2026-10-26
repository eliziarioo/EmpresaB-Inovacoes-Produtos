import { useEffect, useState } from 'react'
import { IconeEnvelope, IconeFechar } from '../components/Icones.jsx'
import '../parteA.css'

function RecuperarSenha({ aoFechar }) {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    function aoApertarTecla(evento) {
      if (evento.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoApertarTecla)
    return () => window.removeEventListener('keydown', aoApertarTecla)
  }, [aoFechar])

  function aoSubmeter(evento) {
    evento.preventDefault()
    setEnviado(true)
  }

  return (
    <div className="janela-fundo" onClick={aoFechar}>
      <form
        className="janela janela-estreita"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recuperar-titulo"
        onClick={(evento) => evento.stopPropagation()}
        onSubmit={aoSubmeter}
      >
        <header className="janela-cabecalho">
          <h2 id="recuperar-titulo">Recuperar senha</h2>
          <button
            type="button"
            className="janela-fechar"
            onClick={aoFechar}
            aria-label="Fechar"
          >
            <IconeFechar tamanho={22} />
          </button>
        </header>

        {enviado ? (
          <>
            <p className="aviso-sucesso" role="status">
              Se o e-mail estiver cadastrado, você receberá um link para
              redefinir a senha (simulado no protótipo).
            </p>
            <footer className="janela-rodape">
              <button
                type="button"
                className="botao-principal botao-auto"
                onClick={aoFechar}
              >
                Fechar
              </button>
            </footer>
          </>
        ) : (
          <>
            <p className="pagina-apoio">
              Informe o e-mail corporativo e enviaremos um link para redefinir a
              senha.
            </p>

            <label className="campo">
              <span>E-mail corporativo</span>
              <div className="campo-icone">
                <span className="campo-icone-esquerda">
                  <IconeEnvelope tamanho={20} />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="marina.costa@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </label>

            <footer className="janela-rodape">
              <button
                type="button"
                className="botao-secundario"
                onClick={aoFechar}
              >
                Cancelar
              </button>
              <button type="submit" className="botao-principal botao-auto">
                Enviar link
              </button>
            </footer>
          </>
        )}
      </form>
    </div>
  )
}

export default RecuperarSenha
