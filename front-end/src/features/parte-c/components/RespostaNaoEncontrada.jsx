import Icone from "./Icone.jsx";
export default function RespostaNaoEncontrada({ resposta, aoContato }) {
  return (
    <div className="tc-balao tc-balao-aviso">
      <h3>
        <Icone id="6-281-imgGroup2" tamanho={18} />
        Informação não encontrada
      </h3>
      <p>{resposta.resposta}</p>
      {resposta.complemento && <p>{resposta.complemento}</p>}
      {resposta.escalar_para && (
        <button
          className="tc-secundario"
          onClick={() => aoContato(resposta.escalar_para)}
        >
          {resposta.escalar_para.rotulo ||
            `Falar com ${resposta.escalar_para.nome}`}
        </button>
      )}
    </div>
  );
}
