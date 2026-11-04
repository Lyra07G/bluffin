# Bluffin — Etapa 1: Perfil e estatísticas

Esta atualização parte da versão 4 estável e adiciona o primeiro bloco de perfil do jogador.

## O que entrou
- ID de visitante persistente no navegador (`localStorage`), em vez de depender apenas da sessão.
- Perfil consultável pelo botão **Meu perfil e estatísticas** no menu principal.
- Atalho para o perfil ao clicar na área do próprio alien na tela de preparação.
- Estatísticas calculadas no servidor ao concluir uma partida: partidas, vitórias, derrotas, vitórias como impostor/inocente, sequência atual e melhor sequência.
- Histórico das últimas 30 partidas.
- Persistência em `data/profiles.json`, criado automaticamente pelo servidor.
- CSS e JavaScript com versão de cache atualizada para evitar carregar os arquivos antigos.

## Instalação
1. Faça backup da pasta atual do Bluffin.
2. Extraia o ZIP e substitua os arquivos da aplicação pelos desta versão.
3. Mantenha a pasta `data` em local persistente no servidor; ela será criada automaticamente.
4. Execute `npm install` (ou `npm ci`) e depois `npm start`.
5. Abra o jogo e conclua uma partida. O perfil passa a mostrar os dados após o resultado final.

## Importante nesta etapa
- O perfil de visitante fica associado ao navegador/dispositivo. Limpar os dados do navegador ou trocar de dispositivo cria outro visitante.
- Cadastro, login e conversão de visitante para conta sincronizada entre dispositivos ainda não estão ativos nesta entrega. A interface informa isso para não dar a entender que já existe sincronização.
- O arquivo `data/profiles.json` contém os dados persistidos. Inclua-o nos backups do servidor.
- Esta etapa não altera votação, perguntas, palavras, salas ou marcações privadas de suspeitos.

## Validação
Os arquivos JavaScript foram verificados com `node --check`. O teste de inicialização completo não foi concluído neste ambiente porque a instalação da dependência `ws` excedeu o tempo disponível; faça a validação final no ambiente onde o projeto já possui as dependências instaladas.
