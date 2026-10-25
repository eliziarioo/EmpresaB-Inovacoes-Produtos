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

O modo demonstrativo é o padrão e reproduz os textos e estados do Figma. O modo API utiliza exclusivamente os dados retornados pelo servidor: não acrescenta serviços, documentos ou informações pessoais fictícias para preencher a tela.

A API original é um protótipo com respostas pré-escritas. Nenhum dos modos implementa um modelo de IA. Sem internet, a busca retorna apenas trechos literais com seção e página.

Consulte o guia de instalação entregue com o pacote para conectar as rotas da Parte A, instalar a extensão opcional da API e testar o funcionamento offline em uma build de produção.
