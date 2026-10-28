import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { guardar } from "./armazenamentoService.js";
import {
  enfileirar,
  pendentes,
  sincronizarFila,
} from "./sincronizacaoService.js";
import {
  baixarPacote,
  lerPacote,
  buscarTrechos,
  conferirVersoes,
  chavePacote,
} from "./offlineService.js";
const usuario = () => `teste:${crypto.randomUUID()}`;
const ordem = { ordem_id: "OS-1" };
const pacote = {
  ordem,
  documentos: [{ id: "doc-1", versao: "1" }],
  trechos: [
    {
      documento_id: "doc-1",
      codigo: "PR-1",
      versao: "1",
      secao: "4.2",
      pagina: 7,
      trecho: "A permissão de trabalho deve estar assinada antes de iniciar.",
    },
  ],
};

test("download só publica quando todos os PDFs chegam", async () => {
  const u = usuario();
  await guardar(chavePacote(u, "OS-1"), { ...pacote, antigo: true });
  const api = {
    pacote: async () => ({
      ...pacote,
      documentos: [...pacote.documentos, { id: "doc-2" }],
    }),
    abrirArquivo: async (d) => {
      if (d.id === "doc-2") throw Error("rede");
      return new Blob(["pdf"]);
    },
  };
  await assert.rejects(baixarPacote(api, u, ordem));
  assert.equal((await lerPacote(u, "OS-1")).antigo, true);
});
test("busca local devolve trecho, seção e página sem criar resposta", () => {
  const r = buscarTrechos(pacote, "permissão assinada");
  assert.equal(r.length, 1);
  assert.equal(r[0].trecho, pacote.trechos[0].trecho);
  assert.equal(r[0].pagina, 7);
  assert.equal(r[0].secao, "4.2");
  assert.equal(buscarTrechos(pacote, "pressão hidrostática").length, 0);
});
test("pacote revogado ou desatualizado nunca entra na busca", () => {
  assert.deepEqual(
    buscarTrechos({ ...pacote, desatualizado: true }, "permissão"),
    [],
  );
  assert.deepEqual(
    buscarTrechos({ ...pacote, revogado: true }, "permissão"),
    [],
  );
});
test("falha no envio preserva a fila e separa os usuários", async () => {
  const a = usuario(),
    b = usuario();
  await enfileirar(a, "OS-1", "consulta_offline", { pergunta: "permissão" });
  await enfileirar(b, "OS-1", "consulta_offline", {});
  await assert.rejects(
    sincronizarFila(
      {
        sincronizar: async () => {
          throw Error("rede");
        },
      },
      a,
    ),
  );
  assert.equal((await pendentes(a)).length, 1);
  assert.equal((await pendentes(b)).length, 1);
});
test("recibo parcial remove apenas IDs confirmados e mantém novos eventos", async () => {
  const u = usuario(),
    a = await enfileirar(u, "OS-1", "consulta_offline", {});
  await enfileirar(u, "OS-1", "documento_aberto", {});
  const total = await sincronizarFila(
    {
      sincronizar: async () => {
        await enfileirar(u, "OS-1", "consulta_offline", {});
        return { confirmados: [a.id] };
      },
    },
    u,
  );
  assert.equal(total, 1);
  assert.equal((await pendentes(u)).length, 2);
});
test("duas tentativas simultâneas usam uma única requisição", async () => {
  const u = usuario();
  await enfileirar(u, "OS-1", "consulta_offline", {});
  let chamadas = 0;
  const api = {
    sincronizar: async (eventos) => {
      chamadas++;
      return { confirmados: eventos.map((e) => e.id) };
    },
  };
  await Promise.all([sincronizarFila(api, u), sincronizarFila(api, u)]);
  assert.equal(chamadas, 1);
  assert.equal((await pendentes(u)).length, 0);
});
test("versão nova falhando ao baixar bloqueia a antiga", async () => {
  const u = usuario();
  await guardar(chavePacote(u, "OS-1"), pacote);
  const api = {
    pacote: async () => ({
      ...pacote,
      documentos: [{ id: "doc-1", versao: "2" }],
    }),
    abrirArquivo: async () => {
      throw Error("rede");
    },
  };
  await assert.rejects(conferirVersoes(api, u));
  assert.equal((await lerPacote(u, "OS-1")).desatualizado, true);
});
test("revogação e índice incompatível bloqueiam consulta local", async () => {
  for (const status of [403, 409]) {
    const u = usuario();
    await guardar(chavePacote(u, "OS-1"), pacote);
    await assert.rejects(
      conferirVersoes(
        {
          pacote: async () => {
            throw Object.assign(Error("alterado"), { status });
          },
        },
        u,
      ),
    );
    assert.equal((await lerPacote(u, "OS-1")).desatualizado, true);
  }
});
test("nova versão completa substitui arquivos e trechos juntos", async () => {
  const u = usuario();
  await guardar(chavePacote(u, "OS-1"), pacote);
  await conferirVersoes(
    {
      pacote: async () => ({
        ...pacote,
        documentos: [{ id: "doc-1", versao: "2" }],
      }),
      abrirArquivo: async () => new Blob(["pdf v2"]),
    },
    u,
  );
  const p = await lerPacote(u, "OS-1");
  assert.equal(p.documentos[0].versao, "2");
  assert.equal(await p.arquivos["doc-1"].text(), "pdf v2");
  assert.equal(p.desatualizado, undefined);
});

test('arquivo alterado durante download não é publicado',async()=>{
 const u=usuario();await assert.rejects(baixarPacote({pacote:async()=>({...pacote,documentos:[{id:'doc-1',versao:'1',sha256:'invalido'}]}),abrirArquivo:async()=>new Blob(['pdf'])},u,ordem));assert.equal(await lerPacote(u,'OS-1'),null)
})
