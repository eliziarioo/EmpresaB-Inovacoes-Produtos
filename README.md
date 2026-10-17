# Projeto Final IbmecJr x Visagio

## Copiloto de Operações de Campo

Repositório da equipe de código de Produtos e Inovações para o Projeto Final do Processo Seletivo 26.2 da IbmecJr, em parceria com a Visagio.

### Contexto

O Projeto Final consiste em criar, em conjunto com as demais áreas da empresa (Marketing, Vendas, Processos, Financeiro, Jurídico e Gestão de Pessoas), um produto baseado em IA a partir de um case fictício: uma empresa de médio porte que presta serviços técnicos e manutenção industrial para o setor de Óleo e Gás. A receita vem de contratos e os custos vêm de mão de obra especializada, equipamentos e execução dos serviços.

A apresentação final está marcada para 29/10/2026.

### O problema

Hoje as empresas montam as equipes de forma manual e o técnico não tem apoio imediato em campo. Isso gera:

- técnico sem a habilitação exigida pela OS (atraso, retrabalho e multa)
- equipe maior ou mais distante do que precisava (deslocamento e diárias)
- técnico parado sem OS compatível (mão de obra paga sem receita)
- certificação que vence sem aviso (perda de capacidade e risco de conformidade)
- dúvida de procedimento em campo (retrabalho e risco de segurança)

### A solução

Um copiloto que acompanha o serviço técnico do começo ao fim, em dois módulos que usam a mesma base de dados (ordens de serviço, técnicos e certificações, manuais e normas).

**Módulo 1: recomendação de equipes (antes do serviço)**
1. Lê a OS em texto livre e infere tipo de serviço, habilitações, tamanho da equipe e duração.
2. Cruza com a base: certificações vigentes, disponibilidade, localização e histórico de serviços parecidos.
3. Sugere a equipe com o motivo de cada escolha, e o gestor aprova ou ajusta.

**Módulo 2: assistente de procedimentos (durante o serviço)**
- O técnico pergunta em linguagem natural e o assistente responde só com base nos manuais, procedimentos e normas do cliente.
- Toda resposta cita o trecho e a fonte.
- Já conhece a OS, o equipamento e as habilitações de quem pergunta.
- Avisa que não substitui o procedimento oficial.
- No fim, o técnico registra a execução e o registro volta para a base, melhorando as estimativas do módulo 1.

Princípio do produto: a IA sugere, o gestor decide. O modelo que lê a OS e conversa não é retreinado, e o histórico alimenta só uma camada de previsão, sem usar informações sensíveis.

### Protótipo

O protótipo mostra um serviço em cinco telas:

1. Painel do gestor (fila de OS e capacidade das equipes)
2. OS entrando (texto livre ao lado dos requisitos que a IA identificou)
3. Equipe sugerida (nomes, justificativas e botões de aprovar ou ajustar)
4. Visão do técnico (agenda do dia e alertas de vencimento de certificação)
5. Chat do técnico (resposta com trecho do manual e fonte)

### Equipe

#### Equipe de código

- Bernardo Eliziario
- Giovanna Perrone
- João Pedro Ferreira
- Pedro Albuquerque

#### Equipe de forma geral

- Bernardo Eliziario
- Giovanna Coelho (Equipe de Design)
- Giovanna Perrone
- João Pedro Ferreira
- João Victor Braga (Equipe de Design)
- Pedro Albuquerque
- Yanne Joia (Equipe de Design)

## O que cada área entrega

A empresa tem sete setores, cada uma com entregas próprias, mas o resultado final tem que ser uma solução integrada.

- **Produtos e Inovações:** define e evolui o produto e o protótipo, e avisa as demais áreas quando algo muda.
- **Marketing:** benchmark, nome, identidade visual, estratégia de comunicação e quatro materiais, um deles em vídeo.
- **Vendas:** perfil de cliente, roteiro de diagnóstico, proposta comercial por módulo e simulação de reunião.
- **Processos:** processo atual como hipótese, gargalos e processo futuro com o produto, no Bizagi.
- **Financeiro:** DRE e fluxo de caixa do case, custos e receita do produto e cenários de viabilidade.
- **Jurídico:** mapa de riscos dos dois módulos, cláusulas-chave e requisitos de conformidade.
- **Gestão de Pessoas:** mapa de competências, plano de capacitação, análise de adoção e Post-Mortem.

### Entregas mínimas de Produtos e Inovações

Objetivo da área: definir a solução proposta e mostrar como o produto atende à oportunidade identificada, além de manter as outras áreas informadas sobre as definições do produto, avisando quando algo ainda for preliminar e quando houver mudança relevante.

- [x] Identificação do problema e da oportunidade de negócio
- [x] Definição da proposta de valor e do público inicialmente considerado
- [x] Descrição do escopo, das funcionalidades e da lógica de funcionamento do produto
- [ ] Protótipo demonstrativo, utilizando recursos compatíveis com o nível de desenvolvimento esperado
- [ ] Justificativa das principais decisões e dos diferenciais da solução

### Status do projeto

- [x] Exploração inicial
- [x] Definição da proposta-base
- [ ] Desenvolvimento e validação
- [ ] Consolidação final

### Como rodar o projeto

Siga os passos abaixo para executar o protótipo localmente em sua máquina:

1. Pelo terminal, acesse a pasta da API:
   ```bash
   cd api
   ```

2. Instale as dependências necessárias do Python:
   ```bash
   pip install -r requirements.txt
   ```

3. Inicie o servidor do Django:
   ```bash
   python manage.py runserver
   ```

4. Abra o seu navegador de preferência e acesse o endereço:
   http://127.0.0.1:8000/painel
   