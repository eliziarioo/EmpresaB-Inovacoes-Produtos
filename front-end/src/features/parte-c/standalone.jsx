import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TecnicoApp from "./TecnicoApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TecnicoApp />
  </StrictMode>,
);
// O navegador exige HTTPS (ou localhost) para o aplicativo abrir sem rede.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./tecnico-sw.js")
    .catch((error) =>
      console.error("Não foi possível preparar o aplicativo offline:", error),
    );
}
