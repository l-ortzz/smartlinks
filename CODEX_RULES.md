# Smart Links - Codex Rules

Antes de alterar qualquer código:

1. Leia PROJECT_CONTEXT.md.

2. Não refatore código funcional sem solicitação explícita.

3. Não alterar:

   * Estrutura Repository → Service → Controller
   * Prisma schema sem aprovação
   * Rotas existentes
   * Fluxos já validados

4. Prioridade atual:

   * UX
   * Analytics
   * Upload de imagens

5. Produtos Relacionados:

   * Backend concluído
   * Não alterar lógica de persistência

6. Sempre propor plano antes de alterar múltiplos arquivos.

7. Sempre listar arquivos que serão modificados.

8. Preferir mudanças incrementais.

9. Não criar novas dependências sem aprovação.

10. Manter compatibilidade com o MVP atual.
