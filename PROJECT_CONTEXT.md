# Estado Atual

Last Updated: 2026-06-27

Versão Atual:

MVP ≈ 95%

---

# Smart Pages

Status: ✅ Praticamente Concluído

Implementado:

- Cadastro
- Login
- Perfil da empresa
- Página pública da empresa
- Produtos
- Upload múltiplo de imagens (Cloudinary)
- Produtos relacionados
- Reservas
- Integração WhatsApp
- Analytics V1
- Dashboard reorganizado
- Módulo Pages separado do Agends

Pendências:

- Ajustes UX
- Responsividade
- Correções visuais
- Pequenos bugs

---

# Smart Agends

Status: 🚧 Quase Concluído

Implementado:

- CRUD Serviços
- Upload de imagem
- Página pública de serviços
- Disponibilidade
- Agendamentos
- Agenda
- Integração WhatsApp

Pendências:

- Validação completa dos fluxos
- Ajustes visuais
- Testes finais

---

# Billing (Novo)

Status: 🚧 Em Desenvolvimento

Implementado:

- Integração Sandbox Asaas
- Customer criado automaticamente no cadastro
- Subscription local (PostgreSQL)
- Estrutura Repository → Service → Controller
- Plan padrão
- Tela Mensalidade (Frontend)
- Integração inicial Asaas

Em desenvolvimento:

- Atualização de Customer
- Criação da assinatura recorrente
- PIX
- Boleto
- Webhook
- Middleware de assinatura

---

# Dashboard

Status: ✅ Reorganizado

Separação lógica:

## Smart Pages

- Empresa
- Produtos
- Analytics

## Smart Agends

- Serviços
- Disponibilidade
- Agenda

## Conta

- Mensalidade
- Configurações
- Ajuda

No futuro, o dashboard exibirá apenas os módulos contratados pelo cliente (Pages, Agends ou ambos).

---

# Arquitetura

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

Uploads

- Cloudinary

Pagamento

- Asaas

---

# Fluxos Principais

## Aquisição

Landing

↓

Cadastro

↓

Customer Asaas

↓

Subscription Local (PENDING)

↓

Dashboard

↓

Mensalidade

↓

Pagamento

↓

Webhook

↓

ACTIVE

---

## Smart Pages

Produto

↓

Reserva

↓

WhatsApp

---

## Smart Agends

Serviço

↓

Agendamento

↓

WhatsApp

---

# Regras do MVP

Sempre priorizar:

1. Fluxo comercial
2. Fluxo financeiro
3. Fluxo do cliente

Toda nova funcionalidade deve responder:

> "Isso aproxima o Smart Links do lançamento?"

Caso não aproxime:

Mover para backlog.

---

# Pendências Antes do Lançamento

## Billing

- Finalizar geração de cobrança
- Webhook
- Middleware de assinatura

## Conta

- Recuperação de senha
- Configurações
- Ajuda
- Página de contato

## Infraestrutura

- Deploy
- SSL
- Domínio
- Testes completos

---

# Pós MVP

Não implementar nesta fase:

- IA
- CRM
- Google Calendar
- Outlook
- Meta
- Multiusuário
- Mobile
- Analytics avançado
- Cupons
- Plano anual
- Upgrade/Downgrade
- Marketplace