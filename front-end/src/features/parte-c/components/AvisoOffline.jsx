export default function AvisoOffline({ offline, pendencias, aoAbrir, modo }) {
  if (!offline && !pendencias) return null;
  return (
    <button className="tc-offline-aviso" onClick={aoAbrir}>
      {offline
        ? "Sem conexão · consultar conteúdo baixado"
        : modo === "api"
          ? `${pendencias} registro(s) guardado(s) neste aparelho`
          : `${pendencias} registro(s) aguardando sincronização`}
    </button>
  );
}
