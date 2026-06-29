Investigar por que o frontend continua vendo Subscription.status PENDING após confirmação no Asaas.

Validar se o webhook está ativando a mesma assinatura do usuário logado no frontend.

Verificar:
- qual userId está autenticado no frontend;
- qual subscriptionId / asaasSubscriptionId pertence a esse usuário;
- se o POST /webhook recebido corresponde ao mesmo asaasSubscriptionId;
- se /subscriptions retorna o status atualizado após o webhook.

Não alterar frontend sem provar que /subscriptions está retornando ACTIVE.