import { useEffect, useState } from 'react'
import { buscarUsuarios } from '../services/adminService.js'
import '../parteA.css'

const PERFIS = {
  gestor: { texto: 'Gestor', classe: 'selo-gestor' },
  administrador: { texto: 'Administrador', classe: 'selo-admin' },
  tecnico: { texto: 'Técnico', classe: 'selo-tecnico' },
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    buscarUsuarios()
      .then((dados) => {
        if (ativo) setUsuarios(dados)
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
        <h2>Usuários</h2>
        <button type="button" className="link">
          + Convidar
        </button>
      </header>

      {erro && <p className="login-erro cartao-vazio">{erro}</p>}

      <ul className="linhas">
        {usuarios.map((usuario) => {
          const perfil = PERFIS[usuario.perfil]
          return (
            <li
              key={usuario.id}
              className={usuario.ativo ? 'usuario' : 'usuario usuario-inativo'}
            >
              <span className="usuario-nome">{usuario.nome}</span>
              <span className={`selo selo-pequeno ${perfil.classe}`}>
                {perfil.texto}
              </span>
              <span className="usuario-situacao">
                <span className="ponto" />
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default Usuarios
