import { useState } from "react";
import Icone from "../components/Icone.jsx";
export default function DocumentosTecnico({ documentos, aoAbrir, aoOffline }) {
  const [busca, setBusca] = useState("");
  const normalizar = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const encontrados = documentos.filter((d) =>
    normalizar(d.codigo + " " + d.titulo).includes(normalizar(busca)),
  );
  return (
    <main className="tc-rolagem tc-listagem">
      <label className="tc-busca">
        <Icone id="286-118-imgGroup" />
        <input
          aria-label="Buscar documento"
          placeholder="Buscar documento"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>
      <p className="tc-nota-documentos">
        <Icone id="286-118-imgGroup1" tamanho={14} />
        Documentos aprovados pela empresa. Toque para abrir.
      </p>
      {encontrados.map((d) => (
        <button
          className="tc-cartao tc-documento-cartao"
          key={d.id}
          onClick={() => aoAbrir(d)}
        >
          <span className="tc-documento-icone">
            <Icone id="286-118-imgGroup2" tamanho={20} />
          </span>
          <span className="tc-documento-info">
            <span className="tc-codigo">
              {d.codigo} · {d.versao_rotulo || `v${d.versao}`}
            </span>
            <strong>{d.titulo}</strong>
            <small>
              {d.aprovado_em
                ? `Aprovado em ${d.aprovado_em}`
                : "Data de aprovação não informada"}
            </small>
          </span>
          <span className="tc-ver">
            <Icone id="286-118-imgGroup3" tamanho={16} />
            Ver
          </span>
        </button>
      ))}
      {!encontrados.length && (
        <p className="tc-vazio">Nenhum documento encontrado.</p>
      )}
      <section className="tc-acesso-offline">
        <h2>Documentos sem internet</h2>
        <p>Prepare os documentos autorizados do serviço antes de embarcar.</p>
        <button className="tc-secundario" onClick={aoOffline}>
          Gerenciar acesso offline
        </button>
      </section>
    </main>
  );
}
