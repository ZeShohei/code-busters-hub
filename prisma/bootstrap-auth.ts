import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, TeamMemberRole } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!databaseUrl) {
  throw new Error("DATABASE_URL ist nicht gesetzt.");
}

if (!email) {
  throw new Error("BOOTSTRAP_ADMIN_EMAIL ist nicht gesetzt.");
}

if (!username) {
  throw new Error("BOOTSTRAP_ADMIN_USERNAME ist nicht gesetzt.");
}

if (!password) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD ist nicht gesetzt.");
}

if (password.length < 12) {
  throw new Error(
    "Das Bootstrap-Passwort muss mindestens 12 Zeichen lang sein.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const run = async () => {
  const passwordHash = await bcrypt.hash(password, 12);

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!teamMember) {
    throw new Error(`Kein Teammitglied mit der E-Mail ${email} gefunden.`);
  }

  await prisma.teamMember.update({
    where: {
      id: teamMember.id,
    },
    data: {
      username: username.trim().toLowerCase(),
      passwordHash,
      role: TeamMemberRole.admin,
      active: true,
    },
  });

  console.log(`Admin-Login für ${teamMember.displayName} wurde eingerichtet.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
