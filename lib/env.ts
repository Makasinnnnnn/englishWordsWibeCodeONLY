import { z } from "zod";

const optionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalPositiveInteger = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
}, z.number().int().positive().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  APP_URL: z.string().trim().url("APP_URL must be a valid URL").default("http://localhost:3000"),
  SESSION_TTL_DAYS: optionalPositiveInteger.default(30),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: optionalPositiveInteger.default(30),
  TELEGRAM_BOT_TOKEN: optionalNonEmptyString,
  TELEGRAM_BOT_USERNAME: optionalNonEmptyString,
  TELEGRAM_WEBHOOK_SECRET: optionalNonEmptyString,
  SMTP_HOST: optionalNonEmptyString,
  SMTP_PORT: optionalPositiveInteger,
  SMTP_USER: optionalNonEmptyString,
  SMTP_PASSWORD: optionalNonEmptyString,
  SMTP_FROM: optionalNonEmptyString
});

export type AppEnv = z.infer<typeof envSchema>;

export type FeatureStatus = {
  emailPasswordAuth: boolean;
  passwordResetEmail: "smtp" | "dev-console";
  telegramLogin: boolean;
  csvImportExport: boolean;
  learningDashboard: boolean;
};

export function readEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  return parsed.data;
}

export function getEnvWarnings(env: AppEnv, options: { production?: boolean } = {}) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const telegramPartiallyConfigured = Boolean(env.TELEGRAM_BOT_TOKEN) !== Boolean(env.TELEGRAM_BOT_USERNAME);
  const telegramConfigured = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME);
  const smtpFields = [env.SMTP_HOST, env.SMTP_PORT, env.SMTP_FROM];
  const smtpConfigured = smtpFields.every(Boolean);
  const smtpPartiallyConfigured = smtpFields.some(Boolean) && !smtpConfigured;

  if (telegramPartiallyConfigured) {
    warnings.push("Telegram login needs both TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.");
  }

  if (!telegramConfigured) {
    warnings.push("Telegram login/register/linking will be disabled.");
  }

  if (telegramConfigured && !env.TELEGRAM_WEBHOOK_SECRET) {
    warnings.push("Telegram bot webhook works best with TELEGRAM_WEBHOOK_SECRET configured.");
  }

  if (smtpPartiallyConfigured) {
    warnings.push("SMTP config is partial. Password reset email will not be sent reliably.");
  }

  if (!smtpConfigured) {
    warnings.push("SMTP is not configured. Password reset links will be printed to the server console in dev mode.");
  }

  if (options.production) {
    if (env.APP_URL.includes("localhost") || env.APP_URL.startsWith("http://")) {
      errors.push("Production APP_URL should be the public HTTPS URL.");
    }

    if (!telegramConfigured) {
      errors.push("Production Telegram login requires TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.");
    }

    if (telegramConfigured && !env.TELEGRAM_WEBHOOK_SECRET) {
      errors.push("Production Telegram bot login requires TELEGRAM_WEBHOOK_SECRET.");
    }

    if (!smtpConfigured) {
      errors.push("Production password reset requires SMTP_HOST, SMTP_PORT and SMTP_FROM.");
    }
  }

  return { warnings, errors };
}

export function getFeatureStatus(env: AppEnv): FeatureStatus {
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

  return {
    emailPasswordAuth: true,
    passwordResetEmail: smtpConfigured ? "smtp" : "dev-console",
    telegramLogin: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME),
    csvImportExport: true,
    learningDashboard: true
  };
}
