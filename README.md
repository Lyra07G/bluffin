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

## Ativar anúncios de verdade (Google AdSense)
O código já está pronto pra isso — falta só a conta. Passo a passo:

1. **Publique o site primeiro.** O AdSense só aprova sites que já estão no ar com domínio público (não aceita `localhost`). Suba o Bluffin no Render ou Railway (veja acima) antes de pedir aprovação.
2. **Crie a conta:** acesse [google.com/adsense/start](https://www.google.com/adsense/start), entre com uma conta Google (precisa ter 18 anos ou mais) e cole a URL do seu site publicado.
3. **Espere a análise.** O Google revisa o site (pode levar de alguns dias a algumas semanas) antes de liberar os anúncios. Durante esse tempo o jogo continua funcionando normal, só sem anúncio nenhum.
4. **Depois de aprovado, pegue dois IDs no painel do AdSense:**
   - O **Publisher ID** (formato `ca-pub-XXXXXXXXXXXXXXXX`), em Conta > Informações da conta.
   - Um **Slot ID** pra cada bloco de anúncio que você criar (Anúncios > Por bloco de anúncios > Criar novo bloco) — crie um bloco pra cada posição que quiser usar: `entry` (tela inicial), `lobby` (sala de espera), `final` (placar), `rail-l` e `rail-r` (laterais, só aparecem em telas largas).
5. **Cole os IDs no código**, em `public/index.html`:
   - Descomente a tag `<script>` do AdSense no `<head>` do arquivo e troque `SEU-PUBLISHER-ID` pelo Publisher ID.
   - Na função `adSlot`, preencha `ADSENSE_CLIENT` com o Publisher ID e cada posição em `ADSENSE_SLOTS` com o Slot ID correspondente.
6. **Troque o `public/ads.txt`** pela linha exata que o próprio painel do AdSense mostra em Sites > seu domínio > "Ver instruções do ads.txt".

Enquanto `ADSENSE_CLIENT` estiver vazio, o site mostra só o espaço reservado (nenhum pedido é feito ao Google) — então dá pra publicar e testar tudo antes mesmo de ter a conta aprovada.

**Detalhe técnico:** como o Bluffin redesenha a tela a cada evento (chat, jogador entrando etc.), cada anúncio só é pedido ao Google **uma vez** por visita (função `mountAd` no `index.html`) — pedir de novo a cada redesenho violaria a política do AdSense e arriscaria banir a conta. Os anúncios aparecem na tela inicial, na sala de espera e no placar final — nunca durante uma rodada em andamento, pra não atrapalhar o jogo.

O botão **"✨ PRO"** no topo e `localStorage.bf_pro` continuam sendo só uma vitrine (sem assinatura de verdade ainda) — ficam prontos pra quando você quiser montar isso também.

## Estrutura
- `server.js`: servidor HTTP + WebSocket e toda a lógica do jogo.
- `public/index.html`: a interface do jogo.
- Para mudar palavras e temas, edite `CATS` em `server.js` e a lista `CAT` em `public/index.html` (nomes e ícones).