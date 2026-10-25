export default function AvisoOffline({ offline, pendencias, aoAbrir }) {
  if (!offline && !pendencias) return null;
  return (
    <button className="tc-offline-aviso" onClick={aoAbrir}>
      {offline
        ? "Sem conexão · consultar conteúdo baixado"
        : `${pendencias} registro(s) aguardando sincronização`}
    </button>
  );
}
