
import { useState } from "react";
import ModalAprovacao from "../components/ModalAprovacao";

// Dados demonstrativos da Tela 3 do Figma.
// Não são dados reais de profissionais ou certificações.
const equipeFigma = [
  {
    id: "figma-carlos",
    iniciais: "CM",
    nome: "Carlos Mendes",
    cargo: "Engenheiro de inspeção · responsável pela inspeção NR-13",
    local: "Macaé",
    disponibilidade: "Livre de 17 a 19/10",
    certificacoes: [
      "NR-13 · CREA ativo",
      "CBSP até 03/2029",
      "HUET até 08/2028",
      "NR-35 até 05/2027"
    ]
  },
  {
    id: "figma-ana",
    iniciais: "AR",
    nome: "Ana Ribeiro",
    cargo: "Soldadora qualificada · 4 reparos parecidos em vasos de pressão",
    local: "Macaé",
    disponibilidade: "Livre de 17 a 19/10",
    certificacoes: [
      "Soldadora qualificada até 12/2026",
      "CBSP até 06/2028",
      "HUET até 06/2028",
      "NR-35 até 09/2027"
    ],
    alerta:
      "Conflito: também indicada para OS-2493 em 18/10. " +
      "Se aprovar aqui, a OS-2493 volta para replanejamento."
  },
  {
    id: "figma-paulo",
    iniciais: "PS",
    nome: "Paulo Souza",
    cargo: "Caldeireiro · abertura e fechamento do bocal",
    local: "Macaé",
    disponibilidade: "Folga termina hoje",
    certificacoes: [
      "CBSP até 11/2027",
      "HUET até 11/2027",
      "NR-35 até 02/2027"
    ]
  }
];

const requisitosFigma = [
  "CBSP",
  "HUET",
  "NR-35",
  "Soldador qualificado",
  "Profissional habilitado NR-13"
];

const motivosFigma = [
  "Todos atendem aos requisitos obrigatórios, com documentos válidos na data do serviço.",
  "Os três estão em Macaé e embarcam pelo mesmo voo.",
  "Ana tem o maior número de reparos parecidos entre os soldadores elegíveis.",
  "É a equipe elegível com menor custo estimado."
];

const excluidosFigma = [
  {
    nome: "Jorge Lima · soldador",
    motivo: "Bloqueado: HUET vencido em 02/10"
  },
  {
    nome: "Rita Fonseca · inspetora",
    motivo: "Bloqueada: sem NR-35"
  },
  {
    nome: "Marcos Teixeira · caldeireiro",
    motivo: "Indisponível: embarcado na OS-2476 até 20/10"
  }
];

function obterIniciais(nome) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function EquipeRecomendada({
  ordem,
  resultado,
  onVoltar
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const [aviso, setAviso] = useState("");

  const demonstracaoFigma = ordem.id === "OS-2481";

  const profissionais = demonstracaoFigma
    ? equipeFigma
    : (resultado?.equipe ?? []).map((profissional) => ({
        ...profissional,
        iniciais: obterIniciais(profissional.nome),
        disponibilidade: profissional.disponivel
          ? "Disponível"
          : "Indisponível"
      }));

  const motivos = demonstracaoFigma
    ? motivosFigma
    : [resultado?.justificativa].filter(Boolean);

  const resumo = demonstracaoFigma
    ? "Reparo com solda no vaso V-301 · Plataforma P-XX · prazo 18/10"
    : `${ordem.titulo} · ${ordem.local} · prazo ${ordem.prazo}`;

  return (
    <main className="gestor-container">
      <header className="gestor-equipe-topo">
        <nav
          className="gestor-equipe-breadcrumb"
          aria-label="Caminho de navegação"
        >
          <button
            type="button"
            className="gestor-equipe-caminho"
            onClick={onVoltar}
          >
            Ordens de serviço › {ordem.id}
          </button>

          <span aria-current="page">› Equipe</span>
        </nav>

        <div className="gestor-equipe-topo-linha">
          <div>
            <h1>Equipe recomendada</h1>
            <p className="gestor-equipe-resumo">
              {resumo}
            </p>
          </div>

          <span className="gestor-equipe-status">
            {aprovado
              ? "Equipe aprovada"
              : "◷ Aguardando aprovação"}
          </span>
        </div>
      </header>

      {demonstracaoFigma && (
        <div className="gestor-equipe-requisitos">
          <span>Requisitos obrigatórios:</span>

          {requisitosFigma.map((requisito) => (
            <span
              key={requisito}
              className="gestor-equipe-requisito-chip"
            >
              {requisito}
            </span>
          ))}
        </div>
      )}

      <div className="gestor-equipe-colunas">
        <section className="gestor-equipe-card">
          <div className="gestor-equipe-card-topo">
            <h2>
              Equipe A · {profissionais.length} profissionais
            </h2>

            {demonstracaoFigma && (
              <span className="gestor-equipe-atende">
                ✓ Atende 5 de 5 requisitos
              </span>
            )}
          </div>

          <div className="gestor-equipe-profissionais">
            {profissionais.map((profissional) => (
              <article
                className="gestor-equipe-profissional"
                key={profissional.id}
              >
                <div className="gestor-equipe-avatar">
                  {profissional.iniciais}
                </div>

                <div className="gestor-equipe-pessoa">
                  <h3>{profissional.nome}</h3>
                  <p>{profissional.cargo}</p>

                  <div className="gestor-equipe-certificacoes">
                    {profissional.certificacoes.map(
                      (certificacao) => (
                        <span key={certificacao}>
                          ✓ {certificacao}
                        </span>
                      )
                    )}
                  </div>

                  {profissional.alerta && (
                    <div className="gestor-equipe-alerta">
                      ⚠ {profissional.alerta}
                    </div>
                  )}
                </div>

                <div className="gestor-equipe-disponibilidade">
                  {profissional.local && (
                    <span>⌖ {profissional.local}</span>
                  )}

                  <span>
                    ◷ {profissional.disponibilidade}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="gestor-equipe-lateral">
          <section className="gestor-equipe-card gestor-equipe-motivos">
            <h2>Por que esta equipe</h2>

            <div className="gestor-equipe-motivos-lista">
              {motivos.map((motivo) => (
                <div
                  className="gestor-equipe-motivo"
                  key={motivo}
                >
                  <span aria-hidden="true">✓</span>
                  <p>{motivo}</p>
                </div>
              ))}
            </div>

            {demonstracaoFigma && (
              <p className="gestor-equipe-observacao">
                Custo nunca substitui um requisito
                obrigatório: só equipes 100% elegíveis
                entram na comparação.
              </p>
            )}
          </section>

          {demonstracaoFigma && (
            <section className="gestor-equipe-card gestor-equipe-alternativas">
              <div className="gestor-equipe-alternativas-topo">
                <h2>Alternativas elegíveis</h2>
                <p>
                  Custo estimado de deslocamento e
                  alocação · valores simulados
                </p>
              </div>

              <div className="gestor-equipe-alternativa recomendada">
                <div>
                  <strong>Equipe A</strong>
                  <span className="gestor-equipe-selo">
                    Recomendada
                  </span>
                  <p>Carlos, Ana e Paulo · Macaé</p>
                </div>
                <strong>R$ 21.600</strong>
              </div>

              <div className="gestor-equipe-alternativa">
                <div>
                  <strong>Equipe B</strong>
                  <p>
                    Carlos, Rafael Duarte e Paulo ·
                    soldador vem de Vitória
                  </p>
                </div>
                <strong>R$ 24.300</strong>
              </div>
            </section>
          )}
        </aside>
      </div>

      {demonstracaoFigma && (
        <section className="gestor-equipe-card gestor-equipe-excluidos">
          <div className="gestor-equipe-excluidos-topo">
            <h2>Profissionais não considerados</h2>
            <p>
              Mostrados com o motivo, para o gestor conferir
            </p>
          </div>

          <div className="gestor-equipe-excluidos-lista">
            {excluidosFigma.map((profissional) => (
              <div
                className="gestor-equipe-excluido"
                key={profissional.nome}
              >
                <strong>{profissional.nome}</strong>
                <p>{profissional.motivo}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {aviso && (
        <p className="gestor-equipe-aviso" role="status">
          {aviso}
        </p>
      )}

      <div className="gestor-equipe-acoes">
        {aprovado ? (
          <p className="gestor-sucesso" role="status">
            Equipe aprovada com sucesso!
          </p>
        ) : (
          <>
            <button
              type="button"
              className="gestor-equipe-acao-secundaria"
              onClick={() =>
                setAviso(
                  "A geração do dossiê ainda não está disponível nesta demonstração."
                )
              }
            >
              Dossiê de conformidade
            </button>

            <button
              type="button"
              className="gestor-equipe-acao-secundaria"
              onClick={() =>
                setAviso(
                  "O ajuste manual de equipes ainda não está conectado nesta demonstração."
                )
              }
            >
              Ajustar equipe
            </button>

            <button
              type="button"
              className="gestor-botao"
              onClick={() => setModalAberto(true)}
            >
              Aprovar equipe A
            </button>
          </>
        )}
      </div>

      {modalAberto && (
        <ModalAprovacao
          ordem={ordem}
          onFechar={() => setModalAberto(false)}
          onAprovado={() => {
            setAprovado(true);
            setModalAberto(false);
          }}
        />
      )}
    </main>
  );
}
