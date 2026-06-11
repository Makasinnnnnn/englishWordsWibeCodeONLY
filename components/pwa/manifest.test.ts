import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  it("contains installability fields and icons", () => {
    const manifestPath = join(process.cwd(), "public", "manifest.webmanifest");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      name?: string;
      display?: string;
      start_url?: string;
      icons?: Array<{ src: string; sizes: string; purpose?: string }>;
    };

    expect(manifest.name).toBe("Word Memory Trainer");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons?.some((icon) => icon.src === "/icons/icon-192.png" && icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  it("keeps API routes out of the service worker cache", () => {
    const serviceWorkerPath = join(process.cwd(), "public", "sw.js");
    const source = readFileSync(serviceWorkerPath, "utf8");

    expect(source).toContain('url.pathname.startsWith("/api/")');
  });
});
