// Uma única tabela de registros. As chaves incluem modo, usuário e ordem.
let abertura;
function banco() {
  if (!abertura)
    abertura = new Promise((resolve, reject) => {
      const pedido = indexedDB.open("intelligent-team-tecnico", 1);
      pedido.onupgradeneeded = () =>
        pedido.result.createObjectStore("registros", { keyPath: "chave" });
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => {
        abertura = null;
        reject(
          new Error("Não foi possível abrir o armazenamento do aparelho."),
        );
      };
    });
  return abertura;
}
export async function guardar(chave, valor) {
  const db = await banco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("registros", "readwrite");
    tx.objectStore("registros").put({ chave, valor });
    tx.oncomplete = () => resolve(valor);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Gravação local cancelada."));
  });
}
export async function ler(chave) {
  const db = await banco();
  return new Promise((resolve, reject) => {
    const pedido = db
      .transaction("registros")
      .objectStore("registros")
      .get(chave);
    pedido.onsuccess = () => resolve(pedido.result?.valor ?? null);
    pedido.onerror = () => reject(pedido.error);
  });
}
export async function listar(prefixo) {
  const db = await banco();
  return new Promise((resolve, reject) => {
    const pedido = db
      .transaction("registros")
      .objectStore("registros")
      .getAll();
    pedido.onsuccess = () =>
      resolve(pedido.result.filter((x) => x.chave.startsWith(prefixo)));
    pedido.onerror = () => reject(pedido.error);
  });
}
export async function apagar(chave) {
  const db = await banco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("registros", "readwrite");
    tx.objectStore("registros").delete(chave);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
