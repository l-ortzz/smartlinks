import pg from 'pg';
import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  // Usando a URL exata do seu arquivo .env 
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🚀 Rodando Simulação Consistente...");

    // 1. Criar Empresa com campos validados
    const sufixo = Date.now().toString().slice(-5); // Pega os últimos 5 números do tempo atual
    const user = await prisma.user.create({
      data: {
        name: "Lucas Inovação Tech",
        email: `empresa.${sufixo}@teste.com`,
        numeroWhatsApp: `55679${sufixo}00`, // Cria um número "único" para o teste
        slug: `empresa-slug-${sufixo}`,
      }
    });
    console.log("✅ Empresa criada!");

    // 2. Criar Tag (Apenas com nome, conforme o banco)
    const tag = await prisma.tag.create({
      data: { name: "Promocional" }
    });
    console.log("✅ Tag criada!");

    // 3. Criar Produto (Com price obrigatório e sem o campo 'url' que deu erro)
    const produto = await prisma.product.create({
      data: {
        name: "Smart Link Pro",
        slug: `link-pro-${Date.now()}`,
        price: 99.90, // Campo obrigatório detectado no erro
        userId: user.id,
        // Relacionamento através da tabela intermediária product_tags
        tags: {
          create: [{ tagId: tag.id }]
        }
      }
    });
    console.log("✅ Produto vinculado com sucesso!");

    // 4. Simular Cliques
    await prisma.click.create({
      data: {
        productId: produto.id,
        ip: "127.0.0.1",
        userAgent: "Simulador Lucas"
      }
    });
    console.log("✅ Clique registrado!");

  } catch (error) {
    console.error("❌ Erro detectado:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();