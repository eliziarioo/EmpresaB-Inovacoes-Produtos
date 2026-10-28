# Aplicativo do técnico

`TecnicoApp.jsx` é o ponto de entrada. `standalone.jsx` monta a versão independente em `tecnico.html`.

- `pages/`: início, serviços, documentos, login e assistente.
- `components/`: cabeçalho, navegação, perfil, citações e diálogos.
- `services/tecnicoService.js`: troca entre o cenário do Figma (`demo`) e a API (`api`).
- `services/offlineService.js`: download completo, versões e busca textual nos trechos originais.
- `services/sincronizacaoService.js`: fila persistente, por usuário, e remoção após recibo.
- `services/armazenamentoService.js`: IndexedDB; PDFs são guardados como Blob.
- `data/`: cenário do Figma, respostas demonstrativas e trechos extraídos dos três PDFs fornecidos.
- `assets/`: ícones exportados do Figma e fontes locais, com licenças.
- `parteC.css`: estilos restritos à classe `.tc-app`.

O modo demonstrativo é o padrão e reproduz os textos e estados do Figma. No modo API, `GET /eu`, `GET /profissionais/{id}/servicos`, `GET /documentos`, `POST /chat` e `GET /documentos/{id}/arquivo` alimentam a interface. A ordem só aparece depois da aprovação da equipe pelo gestor. Informações ausentes no perfil retornado pela API são exibidas como não informadas, sem usar o perfil fictício do Figma para preenchê-las.

Para testar com a API atual, crie `front-end/.env.local` com `VITE_TECNICO_MODO=api` e `VITE_API_URL=http://127.0.0.1:8000`, reinicie o Vite e use `paulo@empresa.com.br` / `tecnico123`. O campo visual do Figma é um e-mail; a API autentica pelo usuário `paulo`, extraído da parte antes do `@`.

O download offline só publica trechos locais de documentos que continuam autorizados na agenda e cuja versão e SHA-256 do PDF coincidem com o índice incluído no frontend. A API atual não tem endpoint para receber os registros de consulta feitos offline: eles permanecem guardados no aparelho, sem recibo do servidor. A conferência de versões funciona com os endpoints existentes. A API também não fornece ao técnico serviços concluídos nem todos os detalhes do perfil exibidos no cenário do Figma.

A API original é um protótipo com respostas pré-escritas. Nenhum dos modos implementa um modelo de IA. Sem internet, a busca retorna apenas trechos literais com seção e página.

Consulte o guia de instalação entregue com o pacote para conectar as rotas da Parte A, instalar a extensão opcional da API e testar o funcionamento offline em uma build de produção.
