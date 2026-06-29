import { prisma } from "../src/lib/prisma.ts";

async function main() {
  const exists = await prisma.plan.findFirst({
    where: {
      name: "Smart Links",
    },
  });

  if (exists) {
    console.log("Plano Smart Links já existe.");
    return;
  }

await prisma.plan.create({
  data: {
    name: "Smart Links",
    price: "97.00",
    features: {
      pages: true,
      agends: true,
    },
  },
});

  console.log("Plano Smart Links criado com sucesso!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });