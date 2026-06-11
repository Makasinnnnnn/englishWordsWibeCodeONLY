import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

import { getEnvWarnings, getFeatureStatus, readEnv } from "../lib/env";

type CheckResult = {
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
};

type DatabaseCheckResult =
  | {
      reachable: true;
      appliedMigrations: number;
      migrationDirs: number;
    }
  | {
      reachable: false;
      message: string;
    };

function loadDotEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const rawValue = valueParts.join("=").trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function printResult(result: CheckResult) {
  const marker = result.status === "ok" ? "[ok]" : result.status === "warn" ? "[warn]" : "[error]";
  console.log(`${marker} ${result.label}: ${result.detail}`);
}

async function checkDatabase(): Promise<DatabaseCheckResult> {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const migrationRows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM _prisma_migrations
    `;
    const migrationDirs = readdirSync(resolve(process.cwd(), "prisma", "migrations"), { withFileTypes: true }).filter(
      (entry) => entry.isDirectory()
    );

    return {
      reachable: true,
      appliedMigrations: migrationRows.length,
      migrationDirs: migrationDirs.length
    };
  } catch (error) {
    return {
      reachable: false,
      message: error instanceof Error ? error.message : "Unknown database error"
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  loadDotEnvFile(resolve(process.cwd(), ".env.local"));
  loadDotEnvFile(resolve(process.cwd(), ".env"));

  const production = process.argv.includes("--production") || process.env.NODE_ENV === "production";
  const env = readEnv();
  const features = getFeatureStatus(env);
  const { warnings, errors } = getEnvWarnings(env, { production });
  const database = await checkDatabase();
  const results: CheckResult[] = [
    {
      label: "DATABASE_URL",
      status: "ok",
      detail: "configured"
    },
    {
      label: "APP_URL",
      status: production && env.APP_URL.includes("localhost") ? "warn" : "ok",
      detail: env.APP_URL
    },
    {
      label: "NEXT_PUBLIC_APP_URL",
      status: env.NEXT_PUBLIC_APP_URL ? "ok" : "warn",
      detail: env.NEXT_PUBLIC_APP_URL ?? "not configured"
    },
    {
      label: "Email/password auth",
      status: features.emailPasswordAuth ? "ok" : "error",
      detail: features.emailPasswordAuth ? "enabled" : "disabled"
    },
    {
      label: "Telegram login",
      status: features.telegramLogin ? "ok" : "warn",
      detail: features.telegramLogin ? "enabled" : "disabled until Telegram env is set"
    },
    {
      label: "Telegram bot webhook secret",
      status: env.TELEGRAM_WEBHOOK_SECRET ? "ok" : "warn",
      detail: env.TELEGRAM_WEBHOOK_SECRET ? "configured" : "not configured"
    },
    {
      label: "Password reset email",
      status: features.passwordResetEmail === "smtp" ? "ok" : "warn",
      detail: features.passwordResetEmail === "smtp" ? "SMTP enabled" : "dev console fallback"
    },
    {
      label: "Email confirmation",
      status: features.emailVerificationEmail === "smtp" ? "ok" : "warn",
      detail: features.emailVerificationEmail === "smtp" ? "SMTP enabled" : "dev console fallback"
    },
    {
      label: "CSV import/export",
      status: "ok",
      detail: features.csvImportExport ? "enabled" : "disabled"
    },
    {
      label: "Database connection",
      status: database.reachable ? "ok" : "error",
      detail: database.reachable
        ? `${database.appliedMigrations}/${database.migrationDirs} migrations applied`
        : database.message
    }
  ];

  console.log(`Config check mode: ${production ? "production" : "local/dev"}`);
  for (const result of results) {
    printResult(result);
  }

  for (const warning of warnings) {
    printResult({ label: "Configuration warning", status: "warn", detail: warning });
  }

  for (const error of errors) {
    printResult({ label: "Production requirement", status: "error", detail: error });
  }

  if (results.some((result) => result.status === "error") || errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
