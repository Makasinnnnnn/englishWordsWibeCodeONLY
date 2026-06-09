import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password", async () => {
    const hash = await hashPassword("StrongPass123");

    await expect(verifyPassword("StrongPass123", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("StrongPass123");

    await expect(verifyPassword("WrongPass123", hash)).resolves.toBe(false);
  });
});
