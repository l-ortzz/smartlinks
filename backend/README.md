# 🚀 Smart Links

Smart Links é uma plataforma SaaS desenvolvida para ajudar pequenos negócios a vender e agendar serviços através de links inteligentes compartilhados em Instagram, WhatsApp e redes sociais.

O projeto está dividido em dois módulos principais:

## 🛍️ Smart Pages

Transforma produtos em páginas de conversão.

Fluxo:

Instagram Story/Post
↓
Link Smart Links
↓
Página do Produto
↓
Reserva ou Compra
↓
WhatsApp da Loja

Funcionalidades:

* Cadastro de produtos
* Múltiplas imagens
* Atributos personalizados (cor, tamanho, numeração, etc.)
* Produtos relacionados
* Página pública do produto
* Reserva via WhatsApp
* Analytics de cliques (estrutura pronta)

---

## 📅 Smart Agenda

Transforma serviços em páginas de agendamento.

Fluxo:

Instagram Story/Post
↓
Link Smart Links
↓
Página de Agendamento
↓
Escolha de horário
↓
Confirmação via WhatsApp

Funcionalidades previstas:

* Cadastro de serviços
* Agenda semanal
* Disponibilidade por horário
* Agendamento online
* Integração com WhatsApp

---

# 🎯 Objetivo do MVP

Validar o mercado com dois produtos:

### Smart Pages

Voltado para:

* Lojas de roupas
* Calçados
* Óticas
* Bolsas
* Acessórios

### Smart Agenda

Voltado para:

* Manicures
* Esteticistas
* Clínicas
* Odontologia
* Barbearias
* Salões

---

# 🏗️ Stack Tecnológica

## Backend

* Node.js
* TypeScript
* Fastify
* Prisma ORM
* PostgreSQL

## Frontend

* Vue 3
* Vite
* TypeScript

## Infraestrutura

* Docker
* Docker Compose
* PostgreSQL

---

# 📂 Estrutura do Projeto

```txt
smartlinks/

├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   ├── types/
│   │   └── server.ts
│
└── frontend/
    ├── src/
    ├── public/
    └── vite.config.ts
```

---

# 🗄️ Modelagem Principal

## Empresa

User

Representa uma empresa cliente da plataforma.

Campos principais:

* nome
* email
* slug
* logo
* instagram
* telefone
* endereço
* descrição

---

## Smart Pages

* Product
* ProductAttribute
* ProductAttributeValue
* RelatedProduct
* Reservation
* Order
* OrderItem

---

## Smart Agenda

* Service
* Appointment
* Availability

---

## Plataforma

* Plan
* Subscription
* Click
* Tag
* ProductTag

---

# ✅ Funcionalidades Implementadas

## Backend

* Estrutura Fastify
* Prisma ORM
* PostgreSQL
* Docker
* Migrations
* CRUD inicial de produtos
* CRUD inicial de serviços
* CRUD inicial de reservas
* CRUD inicial de agendamentos
* Company API
* Helper WhatsApp

## Frontend

* Cadastro de conta
* Login
* Dashboard inicial
* Cadastro de produtos
* Página pública do produto
* Seleção dinâmica de atributos
* Reserva via WhatsApp

---

# 📸 Status Atual

Atualmente é possível:

✅ Criar conta

✅ Fazer login

✅ Entrar no dashboard

✅ Cadastrar produtos

✅ Visualizar produtos

✅ Abrir página pública do produto

✅ Reservar produto via WhatsApp

---

# 🚧 Próxima Sprint

## Smart Pages

* Página pública da empresa
* Botão "Copiar Link"
* Produtos relacionados
* Melhorias de UX
* Analytics

## Smart Agenda

* Cadastro de serviços
* Agenda semanal
* Disponibilidade
* Agendamento completo

---

# 🔮 Roadmap Futuro

* Integração Asaas
* Checkout Online
* Split de Pagamento
* Dashboard Analytics
* Gestão de Pedidos
* Multiunidades
* CRM
* Aplicativo Mobile

---

# 🏁 Visão

Permitir que qualquer pequeno negócio consiga:

Cadastrar Produto ou Serviço
↓
Gerar Link
↓
Compartilhar no Instagram
↓
Receber Reservas, Compras ou Agendamentos

Tudo sem depender de marketplaces ou sistemas complexos.

---

Desenvolvido por:

Lucas Ortiz & Bruno
Smart Links ©