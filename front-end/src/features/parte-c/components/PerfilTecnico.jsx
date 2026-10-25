import Modal from "./Modal.jsx";
import Icone from "./Icone.jsx";
export default function PerfilTecnico({ perfil, aoFechar, aoSair }) {
  return (
    <Modal rotulo="Perfil do técnico" classe="tc-perfil" aoFechar={aoFechar}>
      <div className="tc-perfil-topo">
        <span className="tc-perfil-avatar">{perfil.iniciais}</span>
        <div>
          <h2>{perfil.nome}</h2>
          <p>
            {perfil.cargo}
            {perfil.matricula ? ` · Matrícula ${perfil.matricula}` : ""}
          </p>
        </div>
        <button
          aria-label="Fechar perfil"
          className="tc-icone-botao"
          onClick={aoFechar}
        >
          <Icone id="286-226-imgGroup" tamanho={20} />
        </button>
      </div>
      <dl>
        {[
          ["Base", perfil.base],
          ["Escala", perfil.escala],
          ["Supervisor", perfil.supervisor],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v || "Não informado"}</dd>
          </div>
        ))}
      </dl>
      <section className="tc-certificacoes">
        <h3 className="tc-rotulo">Certificações</h3>
        <div>
          {perfil.certificacoes?.map((c) => (
            <span key={c.codigo}>
              <Icone id="286-226-imgGroup1" tamanho={13} />
              {c.codigo} até {c.validade.slice(5, 7)}/{c.validade.slice(0, 4)}
            </span>
          ))}
        </div>
      </section>
      <button className="tc-secundario tc-sair" onClick={aoSair}>
        <Icone id="286-226-imgGroup2" />
        Sair do aplicativo
      </button>
    </Modal>
  );
}
