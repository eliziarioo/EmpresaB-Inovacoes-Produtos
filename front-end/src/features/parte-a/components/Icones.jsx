// Ícones simples em SVG. Usam "currentColor", então pegam a cor do texto onde estiverem.
function Icone({ tamanho = 16, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconeRelogio({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icone>
  )
}

export function IconeBloqueio({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </Icone>
  )
}

export function IconeAlerta({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17.2v.1" />
    </Icone>
  )
}

export function IconeCheck({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icone>
  )
}

export function IconeCheckCirculo({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </Icone>
  )
}

export function IconePlay({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M8 5l11 7-11 7z" />
    </Icone>
  )
}

export function IconeLapis({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19z" />
    </Icone>
  )
}

export function IconeQuadrado({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </Icone>
  )
}

export function IconeArquivo({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
    </Icone>
  )
}

export function IconeFechar({ tamanho }) {
  return (
    <Icone tamanho={tamanho}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icone>
  )
}
