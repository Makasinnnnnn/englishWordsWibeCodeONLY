import { createHash, createHmac, timingSafeEqual } from "crypto";

export type TelegramAuthPayload = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

const defaultMaxAgeSeconds = 24 * 60 * 60;

export function getTelegramDisplayName(data: Pick<TelegramAuthPayload, "first_name" | "last_name" | "username">) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return fullName || data.username || null;
}

export function buildTelegramDataCheckString(data: TelegramAuthPayload) {
  return Object.entries(data)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function calculateTelegramHash(data: TelegramAuthPayload, botToken: string) {
  const secretKey = createHash("sha256").update(botToken).digest();
  return createHmac("sha256", secretKey).update(buildTelegramDataCheckString(data)).digest("hex");
}

export function verifyTelegramAuth(
  data: TelegramAuthPayload,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  maxAgeSeconds = defaultMaxAgeSeconds
) {
  if (!botToken || !data.hash) {
    return false;
  }

  const authTimeMs = data.auth_date * 1000;
  const ageMs = Date.now() - authTimeMs;

  if (!Number.isFinite(authTimeMs) || ageMs < -60_000 || ageMs > maxAgeSeconds * 1000) {
    return false;
  }

  const expected = Buffer.from(calculateTelegramHash(data, botToken), "hex");
  const received = Buffer.from(data.hash, "hex");

  return expected.length === received.length && timingSafeEqual(expected, received);
}
