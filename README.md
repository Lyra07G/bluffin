# Bluffin

Jogo online de dedução e blefe para amigos. Cada um joga no seu computador ou celular, com áudio opcional dentro do jogo.

## Rodar no seu computador
1. Instale o Node.js 18 ou mais novo (https://nodejs.org).
2. Na pasta do projeto: `npm install` e depois `npm start`.
3. Abra http://localhost:3000. Quem criar a sala vira o anfitrião e passa o código de 4 letras.

Obs.: o áudio precisa de HTTPS para o navegador liberar o microfone. Em localhost funciona; na internet, use uma hospedagem com HTTPS (as duas abaixo já dão).

## Hospedar de graça (Render)
1. Crie um repositório no GitHub e envie todos os arquivos desta pasta.
2. No Render: New > Web Service > conecte o repositório.
3. Build Command: `npm install`. Start Command: `npm start`.
4. Escolha o plano gratuito. Quando terminar, o Render dá um link https. Mande para os amigos.

No plano gratuito do Render o serviço "dorme" depois de um tempo sem uso e leva cerca de 1 minuto para acordar. Abra o link alguns minutos antes de jogar.

## Hospedar no Railway
New Project > Deploy from GitHub repo. Ele detecta o Node sozinho. Em Settings > Networking, gere um domínio público.

## Áudio com mais estabilidade (opcional)
O áudio usa WebRTC direto entre os jogadores. Na maioria das redes funciona. Se alguém não ouvir ou não for ouvido (rede corporativa, 4G com NAT rígido), configure um servidor TURN e defina as variáveis de ambiente `TURN_URL`, `TURN_USER` e `TURN_PASS` no serviço.

## Como o jogo funciona
- Anfitrião cria a sala, escolhe tema, 1 ou 2 impostores (2 só com 5 ou mais jogadores), rodadas de dicas, tempo de discussão, última chance, regra de empate e modo de áudio.
- Cada um vê o papel só na própria tela. O servidor guarda os segredos: o navegador dos outros jogadores nunca recebe a palavra nem quem é o impostor.
- Dicas em ordem aleatória. Na discussão, qualquer jogador pode pedir mais uma rodada de dicas e a maioria decide.
- Votação secreta, desempate, última chance do impostor, placar acumulado (grupo 1 ponto cada, impostor 2).
- O sorteio do impostor usa aleatoriedade criptográfica e ninguém é impostor 3 rodadas seguidas (2 seguidas pode).
- Áudio: Desligado, Por turnos (nas dicas só fala quem está na vez e, na discussão, todos falam) ou Aberto.
- Se o anfitrião cair e não voltar em 15 segundos, o comando passa para outro jogador. Quem recarregar a página volta para a mesma sala.

## Preparado para monetização (ainda não ativado)
A interface já tem os espaços reservados, mas nada está ligado a uma rede de anúncios ou pagamento de verdade:
- Blocos `<div class="adslot">` (função `adSlot()` no `public/index.html`) aparecem na tela inicial, na sala de espera e no placar final — nunca durante uma rodada em andamento, pra não atrapalhar o jogo. Troque o conteúdo desse `<div>` pelo snippet da rede de anúncios que você escolher (ex. Google AdSense).
- `localStorage.bf_pro` controla se alguém é "PRO" (ainda só no navegador, sem backend real). Defina `bf_pro=1` no DevTools pra testar como fica a tela sem o selo PRO e sem o tema bloqueado.

Quando decidir o modelo (anúncios, assinatura ou cosméticos pagos), esses pontos são onde plugar a integração de verdade.

## Estrutura
- `server.js`: servidor HTTP + WebSocket e toda a lógica do jogo.
- `public/index.html`: a interface do jogo.
- Para mudar palavras e temas, edite `CATS` em `server.js` e a lista `CAT` em `public/index.html` (nomes e ícones).
