import { useEffect, useState } from 'react'
import { buscarAuditoria } from '../services/adminService.js'
import '../parteA.css'

// "2026-10-22T14:32:00" vira "22/10 · 14:32".
function formatarDataHora(iso) {
  const [data, hora] = iso.split('T')
  const [, mes, dia] = data.split('-')
  return `${dia}/${mes} · ${hora.slice(0, 5)}`
}

function Auditoria() {
  const [registros, setRegistros] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    buscarAuditoria()
      .then((dados) => {
        if (ativo) setRegistros(dados)
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <section className="cartao">
      <header className="cartao-cabecalho">
        <h2>Auditoria</h2>
        <span>Últimas ações</span>
      </header>

      {erro && <p className="login-erro cartao-vazio">{erro}</p>}

      <ul className="linhas">
        {registros.map((registro) => (
          <li key={registro.id} className="auditoria">
            <span className="auditoria-data">
              {formatarDataHora(registro.data_hora)}
            </span>
            <span>
              <strong className="auditoria-ator">{registro.ator}</strong>{' '}
              {registro.acao}{' '}
              <span className="codigo-auditoria">
                {registro.objeto} {registro.versao}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Auditoria
