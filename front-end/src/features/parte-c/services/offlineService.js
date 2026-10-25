import { guardar, ler, listar } from "./armazenamentoService.js";
export const prefixoUsuario = (modo, perfil) =>
  `${modo}:${perfil.profissional_id}`;
export const chavePacote = (usuario, ordem) => `pacote:${usuario}:${ordem}`;
export async function baixarPacote(api, usuario, ordem) {
  const pacote = await api.pacote(ordem);
  // Só publica a nova versão depois de todos os arquivos serem baixados.
  const arquivos = {};
  for (const doc of pacote.documentos) {
    const arquivo = await api.abrirArquivo(doc);
    if (doc.sha256) {
      const bytes = await crypto.subtle.digest('SHA-256', await arquivo.arrayBuffer());
      const hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== doc.sha256) throw new Error('O documento mudou durante o download. Atualize o pacote novamente.');
    }
    arquivos[doc.id] = arquivo;
  }
  const salvo = {
    ...pacote,
    arquivos,
    baixado_em: new Date().toISOString(),
    versao_verificada_em: new Date().toISOString(),
  };
  await guardar(chavePacote(usuario, ordem.ordem_id), salvo);
  return salvo;
}
export const lerPacote = (usuario, ordem) => ler(chavePacote(usuario, ordem));
export async function conferirVersoes(api, usuario) {
  const pacotes = await listar(`pacote:${usuario}:`);
  const resultado = [];
  for (const item of pacotes) {
    const local = item.valor;
    try {
      const remoto = await api.pacote(local.ordem);
      const assinatura = (p) =>
        p.documentos
          .map((d) => `${d.id}:${d.versao}:${d.sha256 || ""}`)
          .sort()
          .join("|");
      if (assinatura(local) !== assinatura(remoto)) {
        await guardar(item.chave, { ...local, desatualizado: true });
        await baixarPacote(api, usuario, remoto.ordem);
        resultado.push(local.ordem.ordem_id);
      } else
        await guardar(item.chave, {
          ...local,
          desatualizado: false,
          revogado: false,
          versao_verificada_em: new Date().toISOString(),
        });
    } catch (e) {
      if (e.status === 409)
        await guardar(item.chave, { ...local, desatualizado: true });
      if (e.status === 403 || e.status === 404)
        await guardar(item.chave, {
          ...local,
          desatualizado: true,
          revogado: true,
        });
      throw e;
    }
  }
  return resultado;
}
export function buscarTrechos(pacote, consulta) {
  if (!pacote || pacote.desatualizado || pacote.revogado) return [];
  const normalizar = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const ignorar = new Set([
    "para",
    "como",
    "sobre",
    "qual",
    "quais",
    "preciso",
    "antes",
    "depois",
    "isso",
    "este",
    "essa",
    "uma",
    "com",
    "que",
    "dos",
    "das",
  ]);
  const termos = [
    ...new Set(
      normalizar(consulta)
        .split(/[^a-z0-9-]+/)
        .filter((t) => t.length > 2 && !ignorar.has(t)),
    ),
  ];
  if (!termos.length) return [];
  return pacote.trechos
    .map((t) => ({
      ...t,
      pontos: termos.reduce(
        (n, p) => n + (normalizar(t.trecho).includes(p) ? 1 : 0),
        0,
      ),
    }))
    .filter((t) => t.pontos >= Math.min(termos.length, 2))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 5);
}
