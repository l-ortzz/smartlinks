import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

async function main() {
  const plan = await prisma.plan.upsert({
    where: {
      name: "Smart Links",
    },
    update: {},
    create: {
      name: "Smart Links",
      price: "97.00",
      features: {
        pages: true,
        agends: true,
      },
    },
  });

  console.log(`Plano ${plan.name} garantido com sucesso!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
