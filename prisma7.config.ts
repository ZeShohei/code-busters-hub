import "dotenv/config";

import { defineConfig } from "prisma/config";

const isGenerateCommand = process.argv.includes("generate");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && !isGenerateCommand) {
  throw new Error(
    "DATABASE_URL ist nicht gesetzt. Für Prisma-Migrationen, Seed und andere Datenbankbefehle wird eine Datenbankverbindung benötigt.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url:
      databaseUrl ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
