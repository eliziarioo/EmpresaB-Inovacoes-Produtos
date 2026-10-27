import { guardar, listar, apagar } from "./armazenamentoService.js";
const emAndamento = new Map();
export async function enfileirar(usuario, ordem_id, tipo, dados = {}) {
  const evento = {
    id: crypto.randomUUID(),
    ordem_id,
    tipo,
    conteudo: dados,
    criado_em: new Date().toISOString(),
  };
  await guardar(`fila:${usuario}:${evento.id}`, evento);
  return evento;
}
export const pendentes = (usuario) => listar(`fila:${usuario}:`);
export function sincronizarFila(api, usuario) {
  if (emAndamento.has(usuario)) return emAndamento.get(usuario);
  const tarefa = (async () => {
    const itens = (await pendentes(usuario)).slice(0, 100);
    if (!itens.length) return 0;
    const recibo = await api.sincronizar(itens.map((i) => i.valor));
    const confirmados = new Set(recibo.confirmados);
    for (const item of itens)
      if (confirmados.has(item.valor.id)) await apagar(item.chave);
    return confirmados.size;
  })().finally(() => emAndamento.delete(usuario));
  emAndamento.set(usuario, tarefa);
  return tarefa;
}
