# Correção dos botões do perfil e da customização

- Removidos os `onclick="event.stopPropagation()"` dos cartões dos modais. Esses handlers interrompiam a propagação dos cliques e impediam que a delegação global executasse os botões internos.
- A delegação agora ignora cliques no conteúdo dos cartões e só fecha o modal quando o clique ocorre diretamente no fundo escurecido.
- X, seleção de cores, seleção de acessórios e botão Concluir continuam usando as ações existentes (`closeCustomize`, `avc`, `avem`).
- O mesmo ajuste foi aplicado ao modal de perfil/estatísticas.
- Cache do `app.js` atualizado para v12.
