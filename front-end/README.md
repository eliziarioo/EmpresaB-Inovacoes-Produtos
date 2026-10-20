# Front-end: Copiloto de Operações de Campo

Interface do protótipo, feita em **React + Vite** (JavaScript). Ela consome a [API mock](../api/README.md), que simula o painel do gestor, a busca de equipes e o chat de procedimentos do técnico.

Para o contexto do projeto, veja o [README geral](../README.md).

## Telas do protótipo

O front-end implementa o serviço em cinco telas:

1. Painel do gestor (fila de OS e capacidade das equipes)
2. OS entrando (texto livre ao lado dos requisitos que a IA identificou)
3. Equipe sugerida (nomes, justificativas e botões de aprovar ou ajustar)
4. Visão do técnico (agenda do dia e alertas de vencimento de certificação)
5. Chat do técnico (resposta com trecho do manual e fonte)

## Como rodar

### Requisitos

- Node.js LTS recente (20.19 ou mais novo), que já inclui o `npm`. Baixe em [nodejs.org](https://nodejs.org).
- API mock rodando (passo 1 abaixo).

Para conferir a instalação:

```bash
node -v
npm -v
```

### Passo a passo

O front-end precisa da API no ar, então use **dois terminais**, ambos a partir da raiz do repositório.

**1. Terminal 1: suba a API**

Siga o [README da API](../api/README.md). Em resumo:

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # macOS / Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

A API fica em `http://127.0.0.1:8000`.

**2. Terminal 2: suba o front-end**

```bash
cd front-end
npm install
npm run dev
```

Abra no navegador: **http://localhost:5173**

> O `npm install` só é necessário na primeira vez e sempre que alguém adicionar dependências novas. Depois de um `git pull`, vale rodar de novo se o `package.json` mudou.

Para parar o servidor: `Ctrl + C` (no Mac também é `Control + C`, não o `Command`).

## Scripts disponíveis

| Comando           | O que faz                                         |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Inicia o servidor de desenvolvimento              |
| `npm run build`   | Gera a versão de produção na pasta `dist/`        |
| `npm run preview` | Visualiza localmente a versão gerada pelo `build` |
| `npm run lint`    | Verifica o código com o ESLint                    |

## Integração com a API

- Endereço base: `http://127.0.0.1:8000`.
- O **CORS já está liberado** no Django, então o front (porta 5173) pode chamar a API normalmente. Se aparecer erro de CORS, confira se a API está rodando e se o endereço usado no front é exatamente `127.0.0.1:8000` ou `localhost:8000`.
- A lista completa de rotas, com métodos e exemplos de body, está na seção **Endpoints** do [README da API](../api/README.md).

### Login

O login é de demonstração. O front envia `POST /entrar` com usuário e senha, recebe um `token` e manda esse token em todas as chamadas seguintes:

```
Authorization: Bearer <token>
```

| Perfil                 | Usuário  | Senha        | Tela inicial                     |
| ---------------------- | -------- | ------------ | -------------------------------- |
| Gestora (Marina Costa) | `marina` | `gestor123`  | Painel do gestor                 |
| Técnico (Paulo Souza)  | `paulo`  | `tecnico123` | Visão do técnico                 |

O perfil devolvido no login traz o campo `tela_inicial`, que indica para onde redirecionar cada usuário. O técnico recebe **403** nas rotas do gestor.

### Pontos de atenção

- **Os dados ficam só na memória da API.** Aprovar equipe, ajustar equipe e criar OS não gravam nada. Para voltar ao estado inicial, use `POST /demo/reiniciar` ou reinicie a API.
- **Reiniciar a API derruba os logins.** Isso acontece também sempre que alguém salva um arquivo `.py` da API com o servidor rodando. Se aparecer `401 Sessão inválida ou expirada`, faça login de novo.
- **Datas:** "hoje" na demonstração é **16/10/2026**, definido no `dados/painel.json` da API.
- **Rotas que só aceitam POST ou PATCH** (como `/entrar`, `/chat` e `/ordens`) precisam de um body JSON completo, com chaves.

## Estrutura de pastas

```
front-end/
├── index.html        # página base (raramente precisa ser editada)
├── package.json      # dependências e scripts
├── vite.config.js    # configurações do Vite
├── public/           # arquivos estáticos (favicon, imagens)
└── src/
    ├── main.jsx      # ponto de entrada do React
    ├── App.jsx       # componente principal
    ├── index.css     # estilos globais
    └── components/   # componentes da aplicação
```

> Esta estrutura é a base gerada pelo Vite. Atualize esta seção conforme o time criar novas pastas (por exemplo, `pages/`, `services/` ou `hooks/`).

## Convenções do time

- Componentes React usam **PascalCase** (ex.: `CardOrdem.jsx`).
- Rode `git pull` antes de começar e antes de cada `git push`, já que o time trabalha direto na `main`.
- Faça commits pequenos, com mensagens descritivas.
- Evite editar o mesmo arquivo ao mesmo tempo que um colega.

## Problemas comuns

| Sintoma                                          | Causa                                       | Solução                                                         |
| ------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------- |
| `'npm' não é reconhecido como comando`           | Node.js não instalado ou fora do PATH       | Instale o Node LTS e abra um terminal novo                      |
| Tela em branco ou "Failed to fetch"              | API desligada                               | Suba a API no outro terminal                                    |
| Erro de CORS no console do navegador             | API fora do ar ou endereço diferente        | Confira se a API está em `http://127.0.0.1:8000`                |
| `401 Sessão inválida ou expirada`                | A API reiniciou e o token antigo caiu       | Faça login de novo                                              |
| `403` ao abrir uma tela do gestor                | Logado como técnico                         | Entre com o usuário `marina`                                    |
| Módulo não encontrado após `git pull`            | Dependência nova que você ainda não instalou | Rode `npm install` dentro de `front-end/`                       |
| Porta 5173 em uso                                | Outro `npm run dev` aberto                  | Feche o outro terminal; o Vite também pode sugerir outra porta  |
