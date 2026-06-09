import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

const passwordIterations = 120_000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await pbkdf2Async(password, salt, passwordIterations, passwordKeyLength, passwordDigest);

  return `pbkdf2:${passwordIterations}:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [method, iterationsValue, salt, hash] = storedHash.split(":");

  if (method !== "pbkdf2" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsValue);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const candidate = await pbkdf2Async(password, salt, iterations, passwordKeyLength, passwordDigest);
  const expected = Buffer.from(hash, "hex");

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
