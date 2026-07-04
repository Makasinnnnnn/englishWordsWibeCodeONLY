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
  NEXT_PUBLIC_APP_URL: z.string().trim().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),
  ADMIN_PASSWORD: optionalNonEmptyString,
  SESSION_SECRET: optionalNonEmptyString,
  SESSION_TTL_DAYS: optionalPositiveInteger.default(30),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: optionalPositiveInteger.default(30),
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: optionalPositiveInteger.default(1440),
  TELEGRAM_BOT_TOKEN: optionalNonEmptyString,
  TELEGRAM_BOT_USERNAME: optionalNonEmptyString,
  TELEGRAM_WEBHOOK_SECRET: optionalNonEmptyString,
  SMTP_HOST: optionalNonEmptyString,
  SMTP_PORT: optionalPositiveInteger,
  SMTP_USER: optionalNonEmptyString,
  SMTP_PASSWORD: optionalNonEmptyString,
  SMTP_FROM: optionalNonEmptyString,
  TRANSLATE_PROVIDER: z.enum(["yandex", "google", "auto"]).default("auto"),
  YANDEX_TRANSLATE_API_KEY: optionalNonEmptyString,
  YANDEX_TRANSLATE_FOLDER_ID: optionalNonEmptyString,
  GOOGLE_TRANSLATE_API_KEY: optionalNonEmptyString,
  YOUTUBE_API_KEY: optionalNonEmptyString
});

export type AppEnv = z.infer<typeof envSchema>;

export type FeatureStatus = {
  emailPasswordAuth: boolean;
  passwordResetEmail: "smtp" | "dev-console";
  emailVerificationEmail: "smtp" | "dev-console";
  telegramLogin: boolean;
  translationSuggestions: "yandex" | "google" | "mock";
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
  const yandexTranslatePartiallyConfigured =
    Boolean(env.YANDEX_TRANSLATE_API_KEY) !== Boolean(env.YANDEX_TRANSLATE_FOLDER_ID);
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
    warnings.push(
      "SMTP is not configured. Password reset and email verification links will be printed to the server console in dev mode."
    );
  }

  if (yandexTranslatePartiallyConfigured) {
    warnings.push("Yandex Translate needs both YANDEX_TRANSLATE_API_KEY and YANDEX_TRANSLATE_FOLDER_ID.");
  }

  if (options.production) {
    if (env.APP_URL.includes("localhost") || env.APP_URL.startsWith("http://")) {
      errors.push("Production APP_URL should be the public HTTPS URL.");
    }

    if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL !== env.APP_URL) {
      warnings.push("NEXT_PUBLIC_APP_URL should match APP_URL in production.");
    }

    if (!env.SESSION_SECRET) {
      warnings.push("SESSION_SECRET is documented for deployments. Set a long random value in production secrets.");
    }

    if (!telegramConfigured) {
      errors.push("Production Telegram login requires TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.");
    }

    if (telegramConfigured && !env.TELEGRAM_WEBHOOK_SECRET) {
      errors.push("Production Telegram bot login requires TELEGRAM_WEBHOOK_SECRET.");
    }

    if (!smtpConfigured) {
      errors.push("Production password reset and email verification require SMTP_HOST, SMTP_PORT and SMTP_FROM.");
    }
  }

  return { warnings, errors };
}

export function getFeatureStatus(env: AppEnv): FeatureStatus {
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

  return {
    emailPasswordAuth: true,
    passwordResetEmail: smtpConfigured ? "smtp" : "dev-console",
    emailVerificationEmail: smtpConfigured ? "smtp" : "dev-console",
    telegramLogin: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME),
    translationSuggestions:
      env.YANDEX_TRANSLATE_API_KEY && env.YANDEX_TRANSLATE_FOLDER_ID
        ? "yandex"
        : env.GOOGLE_TRANSLATE_API_KEY
          ? "google"
          : "mock",
    csvImportExport: true,
    learningDashboard: true
  };
}
