import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  if (!email || !password) {
    throw new Error(
      "Define ADMIN_EMAIL y ADMIN_PASSWORD en .env antes de ejecutar el seed del usuario admin.",
    );
  }

  const passwordHash = await argon2.hash(password);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, nombre },
    create: { email, nombre, passwordHash },
  });

  console.log(`Usuario admin listo: ${usuario.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
