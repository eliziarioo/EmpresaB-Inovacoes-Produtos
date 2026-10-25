import { figmaAssets } from "../assets/figmaAssets.js";

// Arquivos originais do Figma. SVGs usam a largura/altura do próprio arquivo.
export default function Icone({ id, tamanho = 18, logo = false }) {
  return (
    <span
      className="tc-icone"
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      <img
        src={figmaAssets[id]}
        alt=""
        className={logo ? "tc-logo-icone" : undefined}
      />
    </span>
  );
}
