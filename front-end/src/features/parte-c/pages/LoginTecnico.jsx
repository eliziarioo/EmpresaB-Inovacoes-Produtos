import { useState } from "react";
import { figmaAssets } from "../assets/figmaAssets.js";
import Icone from "../components/Icone.jsx";
export default function LoginTecnico({ aoEntrar, aoRecuperar, modo }) {
  const [email, setEmail] = useState(
    modo === "demo" ? "Joao123@empresa.com.br" : "",
  );
  const [senha, setSenha] = useState(modo === "demo" ? "demo2026" : "");
  const [mostrar, setMostrar] = useState(false),
    [erro, setErro] = useState(""),
    [enviando, setEnviando] = useState(false);
  async function entrar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await aoEntrar(email, senha);
    } catch (f) {
      setErro(f.message);
    } finally {
      setEnviando(false);
    }
  }
  return (
    <div className="tc-login">
      <header className="tc-login-marca">
        <img src={figmaAssets["202-188-imgLogo"]} alt="" />
        <p>
          INTELLIGENT <span>TEAM</span>
        </p>
      </header>
      <form className="tc-login-form" onSubmit={entrar}>
        <h1>Entrar</h1>
        <label>
          E-mail corporativo
          <span className="tc-login-campo">
            <Icone id="202-188-imgGroup" />
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </span>
        </label>
        <label>
          Senha
          <span className="tc-login-campo">
            <Icone id="202-188-imgGroup1" />
            <input
              type={mostrar ? "text" : "password"}
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              className="tc-icone-botao"
              aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setMostrar(!mostrar)}
            >
              <Icone id="202-188-imgGroup2" />
            </button>
          </span>
        </label>
        <button type="button" className="tc-recuperar" onClick={aoRecuperar}>
          Esqueci minha senha
        </button>
        {erro && (
          <p className="tc-erro" role="alert">
            {erro}
          </p>
        )}
        <button className="tc-primario" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
