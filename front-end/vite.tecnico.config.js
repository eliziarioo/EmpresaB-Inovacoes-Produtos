import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createHash } from "node:crypto";

function aplicativoOffline() {
  return {
    name: "tecnico-offline",
    generateBundle(_, bundle) {
      // Só o aplicativo e seus assets. PDFs dependem do download autorizado no IndexedDB.
      const arquivos = [...new Set(["tecnico.html", ...Object.keys(bundle).filter(
        (n) => !n.endsWith(".pdf") && !n.endsWith(".map"),
      )])];
      const versao = createHash("sha256")
        .update(JSON.stringify(arquivos))
        .digest("hex")
        .slice(0, 12);
      const codigo = `const CACHE='intelligent-team-tecnico-${versao}';
const URLS=${JSON.stringify(arquivos)}.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('intelligent-team-tecnico-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);u.hash='';u.search='';
 if(!URLS.includes(u.href))return;
 e.respondWith(caches.open(CACHE).then(async c=>{
  if(e.request.mode==='navigate'){try{const r=await fetch(e.request);if(r.ok)await c.put(u.href,r.clone());return r}catch{return c.match(u.href)}}
  return await c.match(u.href)||fetch(e.request);
 }));
});`;
      this.emitFile({
        type: "asset",
        fileName: "tecnico-sw.js",
        source: codigo,
      });
    },
  };
}
export default defineConfig({
  base: "./",
  server: { watch: { usePolling: true } },
  plugins: [react(), aplicativoOffline()],
  build: { outDir: "dist/tecnico", rollupOptions: { input: "tecnico.html" } },
});
