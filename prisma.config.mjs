import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node scripts/seed-database.js",
  },
  datasource: {
    // Generation does not need credentials; database commands still require this URL.
    url: process.env.DATABASE_URL,
  },
});
