# Smart Links — CODEX RULES

Você está trabalhando no projeto Smart Links.

## Objetivo

Finalizar o MVP.

Neste momento NÃO estamos criando novas funcionalidades.

Estamos apenas refinando UX, corrigindo pequenos bugs e finalizando o produto para lançamento.

---

## Arquitetura

Backend

- Fastify
- Prisma
- PostgreSQL
- Repository
- Service
- Controller
- Routes

Frontend

- Vue 3
- TypeScript

Não alterar arquitetura.

Não criar novos padrões.

Não refatorar.

---

## Regras

Sempre:

✔ manter padrão existente

✔ alterar apenas o necessário

✔ preservar UX existente

✔ preservar regras de negócio

Nunca:

✖ criar componentes sem necessidade

✖ mover arquivos

✖ alterar arquitetura

✖ trocar bibliotecas

✖ criar soluções "mais modernas"

---

## Antes de alterar

Sempre procurar se a funcionalidade já existe.

Sempre reutilizar código existente.

---

## Código

Preferir:

- funções pequenas
- alterações localizadas
- menor diff possível

---

## Backend

Não alterar backend se o frontend puder resolver.

Só alterar backend quando a funcionalidade realmente não existir.

---

## Frontend

Preservar:

- App.vue
- styles.css

Não reorganizar arquivos.

---

## UX

Melhorar apenas o solicitado.

Não inventar novas telas.

---

## Build

Ao finalizar executar:

npm run typecheck

npm run build

Corrigir apenas erros gerados pela própria task.

---

## Entrega

Sempre informar:

- arquivos alterados

- resumo das alterações

- problemas encontrados

- validação realizada

## Regra mais importante

Antes de implementar qualquer funcionalidade:

1. Descobrir se ela já existe.

2. Reutilizar o código existente.

3. Alterar o menor número possível de linhas.

4. Nunca reescrever uma funcionalidade que já funciona.

O objetivo é produzir o menor diff possível.