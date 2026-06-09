import { describe, expect, it } from "vitest";

import { createOpaqueToken, hashOpaqueToken } from "./tokens";

describe("opaque tokens", () => {
  it("hashes tokens before storage", () => {
    const token = createOpaqueToken();
    const tokenHash = hashOpaqueToken(token);

    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toHaveLength(64);
    expect(hashOpaqueToken(token)).toBe(tokenHash);
  });
});
