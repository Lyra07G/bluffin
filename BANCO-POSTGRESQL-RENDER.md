# Bluffin — PostgreSQL no Render

Esta versão usa PostgreSQL como armazenamento persistente dos perfis, estatísticas, conquistas, cosméticos desbloqueados e cosméticos equipados.

## Configuração no Render

1. No serviço PostgreSQL, copie a **Internal Database URL**.
2. No serviço Web do Bluffin, abra **Environment**.
3. Crie/atualize `DATABASE_URL` com a Internal Database URL. Não coloque essa URL no código, Git ou arquivos públicos.
4. Faça um novo deploy.

O servidor cria automaticamente a tabela `player_profiles` na primeira inicialização. Cada jogador é armazenado por `player_id`, com o perfil em uma coluna `JSONB`.

## Verificação

- O log de inicialização deve mostrar `PostgreSQL conectado: N perfil(is) carregado(s).`
- Se `DATABASE_URL` estiver ausente no Render, o servidor encerra a inicialização em vez de gravar silenciosamente no disco efêmero.
- Localmente, sem `DATABASE_URL`, o servidor continua usando `data/profiles.json` para facilitar desenvolvimento.

## Dependência

`pg` é instalado durante o deploy a partir de `package.json`. O lockfile foi removido para que o Render resolva a nova dependência no build.

## Observações

- O banco começa vazio; os perfis antigos em `profiles.json` não são migrados automaticamente.
- A aplicação mantém os perfis em memória durante a execução e persiste snapshots no PostgreSQL após atualizações. O banco é a fonte de recuperação após reinicialização.
- Esta etapa não implementa login/contas; o identificador atual do visitante continua sendo usado.
