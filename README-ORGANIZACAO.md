# Bluffin — versão organizada com baixo risco

Esta versão preserva o HTML/CSS/JavaScript original e separa apenas os blocos embutidos:
- `public/index.html`: estrutura HTML;
- `public/css/main.css`: estilos originais;
- `public/js/app.js`: lógica original da interface;
- `server.js`: servidor original.

Importante: ainda não separei `app.js` em `chat.js`, `game.js`, `voice.js` etc., porque essas partes compartilham estado e funções globais. Dividi-las sem testes de integração poderia quebrar o jogo. Também não ativei traduções ainda; os arquivos de idioma devem ser ligados à interface numa etapa própria.

Para usar, substitua os arquivos correspondentes no projeto após fazer backup. Mantenha o `package.json` e o `package-lock.json` atuais do projeto.
