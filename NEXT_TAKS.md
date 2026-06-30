# NEXT TASK

Sprint: Refinamentos finais do MVP

Objetivo:

Melhorar a experiência do usuário sem alterar arquitetura ou regras de negócio.

---

## PARTE 1

Melhorar todos os formulários.

Problema:

Hoje todos utilizam apenas placeholder.

Quando o usuário começa a digitar perde a referência do campo.

Objetivo:

Adicionar labels fixas acima dos campos.

Exemplo:

Nome

[________________]

Descrição

[________________]

Preço

[________________]

Não utilizar floating labels.

Aplicar em:

- Login

- Cadastro

- Empresa

- Produtos

- Serviços

- Disponibilidade

- Agendamento Público

Padronizar espaçamentos.

Não alterar lógica.

---

## PARTE 2

Editar Produtos.

Objetivo:

Adicionar botão:

Editar

em todos os cards de produtos.

Ao clicar:

- carregar produto no formulário existente

- alterar botão para

Salvar alterações

Cancelar edição

Ao salvar:

- atualizar produto

- recarregar lista

- limpar formulário

- voltar para modo criação

Utilizar endpoint existente.

Caso não exista:

implementar seguindo exatamente a arquitetura atual.

---

## Restrições

Não alterar:

- Dashboard

- Landing

- Sidebar

- Analytics

- Billing

- Escolha de módulo

- Produtos relacionados

- Agendamento

---

## Validação

Executar:

npm run typecheck

npm run build

---

## Entrega

Informar:

- arquivos alterados

- resumo

- validações executadas