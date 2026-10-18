# API mock - Copiloto de Operações de Campo

API do protótipo, feita em **Django + Django REST Framework**. Não usa banco de dados: os dados vêm de
arquivos JSON fictícios (`dados/`) e tudo o que muda durante a demonstração fica só na memória do servidor.


## Como rodar

Precisa de Python 3.10 ou mais novo. A partir da raiz do repositório:


```
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```


A API sobe em `http://127.0.0.1:8000/painel`.

- Abrir só `http://127.0.0.1:8000/` da **404, e é normal**: não existe rota na raiz. Comece por `/painel`.
- O terminal pode avisar sobre "unapplied migrations". Pode ignorar, o projeto não usa banco de dados.
- O CORS está liberado, então o front pode chamar a API de outra porta.
- Para parar o servidor: `Ctrl + C`.

## Estrutura do projeto

```
api/
├── manage.py
├── requirements.txt
├── config/                    configuração do Django (settings.py, urls.py)
├── arquivos/                  PDFs fictícios dos documentos (PR-SOL-014, manual do V-301, APR)
├── dados/                     dados fictícios em JSON
│   ├── painel.json                data de referência, usuária do painel, ordens que só somam nos contadores
│   ├── profissionais.json         profissionais: função, certificações com validade, base, custo, agenda
│   ├── matriz_habilitacoes.json   regras que transformam a leitura da OS em exigências e em equipe
│   ├── ordens_de_servico.json     ordens do painel (com a leitura da IA da OS-2481 e da OS-2490)
│   ├── documentos.json            PR-SOL-014, manual do V-301 e APR
│   ├── chat_respostas.json        perguntas sugeridas e respostas prontas, com citação
│   └── perfis.json                contas de demonstração (gestora e técnico)
└── operacoes/                 o app Django com a lógica
    ├── dados.py                   lê os JSONs e guarda o estado da demo na memória
    ├── regras.py                  toda a lógica de negócio
    ├── views.py                   os endpoints (finos: chamam o regras.py e devolvem a resposta)
    ├── urls.py                    liga cada rota a uma view
    └── permissoes.py              login por token e bloqueio de rotas por perfil
```

A decisão de negócio fica num lugar só (`regras.py`), o que facilita testar e mudar.

## O que a API faz

Foi construída em blocos, na ordem do fluxo do produto:

1. **Painel do gestor:** contadores do topo, profissionais disponíveis por função, alertas e a tabela de ordens.
2. **Ordem de serviço em texto livre:** o gestor escreve o serviço, a "IA" extrai os campos (ambiente,
   equipamento, atividades, condição de acesso, prazo) e mostra de qual trecho do texto tirou cada um. Quando
   não tem certeza, **pergunta** (ex.: "há entrada no interior do vaso?"). O gestor pode corrigir qualquer campo
   e as exigências são recalculadas.
3. **Busca de equipes elegíveis:** a matriz define as exigências e a composição, o sistema filtra quem pode ir e
   monta as equipes, ordenadas por custo. Mostra a recomendada, uma alternativa, as justificativas e quem **não**
   foi considerado, com o motivo.
4. **Ajuste e aprovação:** o gestor pode trocar pessoas (o sistema revalida na hora) e aprovar. Ao aprovar, a
   equipe é notificada e as outras ordens que entram em conflito de agenda voltam para replanejamento.
5. **Dossiê e documentos:** relatório de conformidade da equipe (requisito, quem atende, documento, validade) e
   acesso aos PDFs dos documentos autorizados da ordem.
6. **App do técnico:** tela inicial com avisos, próximo serviço, equipe, função e documentos. O técnico **só vê
   o serviço depois que o gestor aprova a equipe**.
7. **Chat de procedimentos:** responde com a citação do documento (seção, página, trecho). Se a informação não
   está nos documentos autorizados da ordem, diz que não encontrou e indica a quem perguntar, em vez de inventar.
8. **Login por perfil:** gestora e técnico, com token. O técnico não acessa as rotas do gestor.

## Como o sistema decide

### Do texto da ordem até a equipe (visão geral)

O caminho, em 3 passos:

1. **Lê a OS e identifica palavras-chave.** O sistema procura no texto termos como "vaso de pressão", "solda",
   "andaime" e "plataforma" e extrai os campos (ambiente, equipamento, atividades, condição de acesso e prazo),
   guardando o trecho do texto de onde veio cada um. **Hoje isso é uma leitura simulada (busca por padrões no
   texto), não uma IA de verdade.** Quando não tem certeza (por exemplo, se há espaço confinado), o sistema
   pergunta ao gestor em vez de assumir.
2. **Cruza as informações.** Os campos extraídos passam pela matriz de habilitações, que gera as exigências
   ("se é offshore, exige CBSP e HUET") e a composição da equipe (ex.: engenharia de inspeção + soldador +
   caldeireiro). Depois cada profissional é conferido contra essas exigências: certificações válidas até o fim do
   serviço e agenda livre.
3. **Monta as equipes.** Combina só quem passou no filtro, calcula o custo de cada combinação e mostra a
   recomendada (a mais barata) e uma alternativa, com as justificativas. Quem ficou de fora aparece com o motivo.

A decisão de quem pode embarcar está inteira nos passos 2 e 3, que são regras, sem IA. Se o passo 1 for
trocado por IA de verdade no futuro, os passos 2 e 3 não mudam.

### Matriz de habilitações

Está em `dados/matriz_habilitacoes.json` (versão 1.2, aprovada pela SST). Cada regra diz "se a ordem tem X,
então exige Y":

| Regra | Se a ordem... | Então exige |
|---|---|---|
| R1 | é offshore | CBSP e HUET válidos, de toda a equipe |
| R2 | tem trabalho em altura | NR-35, de quem trabalha no andaime |
| R3 | envolve solda | 1 soldador qualificado |
| R4 | é em vaso de pressão | profissional habilitado NR-13 (engenheiro responsável pela inspeção) |
| R5 | tem espaço confinado | NR-33, de toda a equipe |

Há também as **composições**: solda em vaso de pressão pede engenharia de inspeção + soldador + caldeireiro;
limpeza interna pede caldeireiros.

### Elegibilidade é filtro de segurança, não pontuação

Para entrar numa equipe, a pessoa precisa:

- ter **todas** as certificações exigidas, válidas **até o fim do serviço** (não só no início);
- estar **sem conflito** com uma alocação confirmada na janela do serviço.

Quem falha em qualquer ponto fica de fora, e o sistema mostra o motivo (certificação vencida, não tem a
certificação, embarcado em outro serviço). A seção "não considerados" mostra quem falha em **apenas um**
critério.

### Custo só desempata

O sistema monta as combinações possíveis **só com gente elegível** e ordena por custo
(diária × dias + deslocamento), com o histórico de reparos parecidos como desempate. **O custo nunca substitui um
requisito obrigatório.**

### Alertas

Calculados na hora, em quatro tipos: `bloqueio`, `sem_profissional_elegivel`, `conflito_agenda` e
`vencimento_proximo` (certificação que vence em até 45 dias).

### Estados da ordem

`rascunho`, `aguardando_aprovacao`, `sem_profissional_elegivel`, `equipe_aprovada`, `em_execucao`, `concluida`
e `replanejamento`.

### Onde entra a IA (hoje simulada)

| Ponto | Hoje | Depois |
|---|---|---|
| Leitura do texto da OS | `interpretar_descricao` em `regras.py`, com expressões regulares sobre uma lista de equipamentos e atividades conhecidos | IA de verdade (ex.: Gemini, plano gratuito), com a leitura atual como plano B |
| Respostas do chat | respostas prontas em `dados/chat_respostas.json` | IA de verdade respondendo só com base nos PDFs, com a citação conferida contra o texto |

Mesmo com IA de verdade, ela só **lê e propõe**. As regras continuam decidindo quem é elegível.

### Dados em memória

Aprovar equipe, ajustar equipe, criar OS e corrigir a leitura **não gravam nos JSONs**: ficam na memória.
Para voltar ao início, use `POST /demo/reiniciar` ou reinicie o servidor. O servidor também reinicia sozinho
**sempre que um arquivo `.py` é salvo** (e isso encerra os logins abertos).

## Login e perfis

O login é de demonstração: o fluxo é o de um sistema real (usuário e senha, token, permissão por rota), mas as
contas são fictícias e ficam em `dados/perfis.json`.

| Perfil | Usuário | Senha | Vê |
|---|---|---|---|
| Gestora (Marina Costa) | `marina` | `gestor123` | tudo |
| Técnico (Paulo Souza, `pro-003`) | `paulo` | `tecnico123` | documentos, chat e os próprios serviços |

Como funciona:

1. `POST /entrar` com `{"usuario": "...", "senha": "..."}` devolve um `token` e o perfil (com `tela_inicial`).
2. O front manda o token em toda chamada: `Authorization: Bearer <token>`.
3. A API descobre o perfil pelo token. Para o **técnico**, as rotas do gestor (painel, alertas, ordens, equipes,
   aprovar, dossiê, lista de profissionais, reiniciar demo) respondem **403**, e os serviços de **outro**
   técnico também.
4. `GET /eu` diz quem está logado. `POST /sair` encerra a sessão.

Por padrão, **quem não manda token acessa tudo** (para testar no navegador). Para exigir login em todas as rotas
(exceto `/entrar` e `/perfis`), mude no `config/settings.py`:

```python
EXIGIR_PERFIL = True
```

## Endpoints

### Login

| Método | Rota | O que faz |
|---|---|---|
| GET | `/perfis` | Lista os perfis de demonstração (sem usuário nem senha) |
| POST | `/entrar` | Login. Body: `usuario`, `senha`. Devolve o token |
| POST | `/sair` | Encerra a sessão |
| GET | `/eu` | Perfil de quem está logado |

### Painel do gestor

| Método | Rota | O que faz |
|---|---|---|
| GET | `/painel` | Contadores do topo (OS abertas, aguardando aprovação, em execução, alertas) e profissionais disponíveis por função |
| GET | `/alertas` | Bloqueio, sem profissional elegível, conflito de agenda e vencimento próximo |
| GET | `/ordens?ordenar=prazo` | Linhas da tabela de ordens (concluídas por último) |

### Ordem de serviço

| Método | Rota | O que faz |
|---|---|---|
| POST | `/ordens` | Cria a OS a partir do texto. Body: `descricao_texto`, `local`, `prazo` (`AAAA-MM-DD` ou `DD/MM/AAAA`). Devolve a leitura da IA |
| GET | `/ordens/{id}` | Detalhe, com a leitura da IA e as exigências calculadas pela matriz |
| PATCH | `/ordens/{id}/interpretacao` | Corrige um campo (`{"campo": "equipamento", "valor": "..."}`) ou responde a dúvida da IA (`{"duvida": 0, "resposta": "Sim, há entrada no vaso"}`). As exigências são recalculadas |

### Equipes

| Método | Rota | O que faz |
|---|---|---|
| POST | `/ordens/{id}/equipes/buscar` | Botão "Buscar equipes elegíveis". Tira a OS de rascunho |
| GET | `/ordens/{id}/equipes` | Equipe recomendada, justificativas, alternativas com custo e profissionais não considerados |
| PATCH | `/ordens/{id}/equipe` | "Ajustar equipe". Body: `{"profissionais": ["pro-001", "pro-002", "pro-003"]}`. Revalida as exigências |
| POST | `/ordens/{id}/equipe/aprovar` | Aprova (409 se a equipe não atende). Notifica a equipe e manda outras OS em conflito para replanejamento |
| GET | `/ordens/{id}/dossie` | Dossiê de conformidade: requisito, quem atende, documento, validade (409 se não houver equipe) |

### Profissionais e app do técnico

| Método | Rota | O que faz |
|---|---|---|
| GET | `/profissionais?funcao=soldador&disponivel=true` | Lista de profissionais (filtros opcionais) |
| GET | `/profissionais/{id}` | Um profissional, com a situação de cada certificação |
| GET | `/profissionais/{id}/servicos` | Tela inicial do app: avisos, próximo serviço, equipe, função e documentos. Só mostra serviços com equipe aprovada; use `?incluir_indicados=true` para ver também os previstos |

### Documentos e chat

| Método | Rota | O que faz |
|---|---|---|
| GET | `/documentos` | Lista de documentos |
| GET | `/ordens/{id}/documentos` | Documentos autorizados da OS |
| GET | `/documentos/{id}/arquivo` | PDF do documento ("Abrir documento original") |
| POST | `/chat` | Body: `ordem_id`, `pergunta`. Responde com citação (documento, versão, seção, página, trecho) ou `tipo: "nao_encontrada"`, indicando a quem perguntar |
| GET | `/chat/sugestoes` | Perguntas sugeridas |

### Demonstração

| Método | Rota | O que faz |
|---|---|---|
| POST | `/demo/reiniciar` | Volta os dados ao estado inicial |

## Roteiro de demonstração

Comece sempre com `POST /demo/reiniciar`. "Hoje" na demonstração é **sexta, 16/10/2026** (definido em
`dados/painel.json`).

1. **Painel:** `GET /painel` mostra 12 OS abertas, 3 aguardando aprovação, 5 em execução e 4 alertas ativos, com
   18 de 26 profissionais disponíveis na semana. `GET /alertas` lista os 4 alertas.
2. **Equipes da OS-2481:** `GET /ordens/OS-2481/equipes` traz a Equipe A (Carlos, Ana e Paulo, R$ 21.600), a
   Equipe B (Carlos, Rafael e Paulo, R$ 24.300) e os três não considerados, cada um com o motivo: Jorge Lima
   (HUET vencido), Rita Fonseca (sem NR-35) e Marcos Teixeira (embarcado na OS-2476 até 20/10).
3. **A dúvida da IA:** `PATCH /ordens/OS-2481/interpretacao` com `{"duvida": 0, "resposta": "Sim, há entrada no vaso"}`.
   Entra a exigência de NR-33, ninguém é elegível e a OS vira "Sem profissional elegível". Responda
   `"Não, serviço externo"` para voltar ao normal.
4. **Aprovação:** `POST /ordens/OS-2481/equipe/aprovar`. A equipe é notificada, a OS-2493 (que a Ana tinha
   indicada no mesmo período) volta para replanejamento, os alertas caem de 4 para 3 e os disponíveis do painel
   passam a "15 de 26".
5. **Dossiê:** `GET /ordens/OS-2481/dossie` mostra "5 de 5 requisitos atendidos", com a validade de cada documento.
6. **App do técnico:** `GET /profissionais/pro-003/servicos` mostra o serviço do Paulo, com embarque, equipe,
   função e os 3 documentos autorizados.
7. **Chat:** `POST /chat` com `{"ordem_id": "OS-2481", "pergunta": "O que preciso confirmar antes de começar a solda no V-301?"}`
   responde com a citação do PR-SOL-014 (seção 4.2, página 7). Com
   `"Qual a pressão de teste do V-301 depois do reparo?"`, responde que não encontrou e indica o engenheiro.
8. **Criar uma OS nova:** `POST /ordens` com o texto livre (veja o exemplo abaixo).
9. `POST /demo/reiniciar` para voltar ao início.

Exemplo de body para `POST /ordens`:

```json
{
  "descricao_texto": "Vazamento no vaso de pressão V-205, módulo 2 da plataforma P-ZZ. Reparo com solda no bocal e inspeção. Acesso por andaime a 5 metros. Prazo de 48 horas.",
  "local": "Plataforma P-ZZ",
  "prazo": "2026-10-30"
}
```

Para perguntar a mesma coisa como técnico, faça o login do Paulo e use o token (veja abaixo).

## Como testar

### No navegador (DRF browsable API)

Com o servidor rodando, abra a rota no navegador. As rotas **GET** abrem direto. Nas rotas **POST** e **PATCH**,
use o campo **Content** no fim da página, escreva o JSON completo (com chaves) e clique em POST ou PATCH.

- Abrir uma rota que só aceita POST pelo navegador mostra **405**. É normal: use o botão POST.
- O JSON precisa ser um objeto completo: `{"duvida": 0, "resposta": "Sim, há entrada no vaso"}`.

### No terminal, com `curl` (necessário para testar login e bloqueios)

O navegador não permite enviar cabeçalhos, então o teste de permissão é pelo `curl` (no Windows 10+ ele já vem
instalado). Exemplos para o cmd:

```
curl -X POST -H "Content-Type: application/json" -d "{\"usuario\":\"paulo\",\"senha\":\"tecnico123\"}" http://127.0.0.1:8000/entrar
```

Copie o `token` da resposta e use no lugar de `COLE_O_TOKEN`:

```
curl -i -H "Authorization: Bearer COLE_O_TOKEN" http://127.0.0.1:8000/painel
curl -i -H "Authorization: Bearer COLE_O_TOKEN" http://127.0.0.1:8000/profissionais/pro-003/servicos
curl -i -H "Authorization: Bearer COLE_O_TOKEN" http://127.0.0.1:8000/profissionais/pro-001/servicos
curl -H "Authorization: Bearer COLE_O_TOKEN" http://127.0.0.1:8000/eu
```

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| 404 em `http://127.0.0.1:8000/` | Não existe rota na raiz | Abra `/painel` |
| 405 ao abrir `/demo/reiniciar`, `/entrar` ou `/chat` | Rota só aceita POST | Use o botão POST (campo Content da página) |
| "JSON parse error" | Body sem as chaves | Envie o objeto completo: `{"campo": "valor"}` |
| `AttributeError: module 'operacoes.regras' has no attribute ...` | O arquivo não foi salvo | Salve com `Ctrl + S` (ative o Auto Save no VS Code) |
| `KeyError` ao ler profissional ou ordem | JSON antigo, sem os campos novos | Substitua pelo JSON atual do repositório |
| Perdi a aprovação / o login | O servidor reiniciou (um `.py` foi salvo) | Refaça a ação; para a demo, não edite código com o servidor rodando |
| 401 "Sessão inválida ou expirada" | Token antigo (servidor reiniciou) | Faça `POST /entrar` de novo |
