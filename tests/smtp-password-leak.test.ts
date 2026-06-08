import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SmtpSettingsResponseSchema } from "@/lib/mailer.functions";

// Server-side files that legitimately handle the raw password.
const SERVER_ONLY_ALLOWLIST = [
  "src/lib/mailer.functions.ts",
  "src/integrations/supabase/types.ts", // auto-generated DB types
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe("smtp_password isolation — source audit", () => {
  it("does not appear in any client-reachable file", () => {
    const offenders: string[] = [];
    for (const file of walk("src")) {
      const rel = file.replace(/\\/g, "/");
      if (SERVER_ONLY_ALLOWLIST.includes(rel)) continue;
      const contents = readFileSync(file, "utf8");
      if (contents.includes("smtp_password")) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it("SMTP page only reads smtp_configured + safe fields", () => {
    const src = readFileSync("src/routes/_authenticated/smtp.tsx", "utf8");
    expect(src).not.toMatch(/smtp_password/);
    expect(src).toMatch(/smtp_configured/);
  });

  it("single-apply page only reads smtp_configured", () => {
    const src = readFileSync("src/routes/_authenticated/single-apply.tsx", "utf8");
    expect(src).not.toMatch(/smtp_password/);
    expect(src).toMatch(/smtp_configured/);
  });
});

describe("smtp_password isolation — server contract", () => {
  const mailer = readFileSync("src/lib/mailer.functions.ts", "utf8");

  it("getSmtpSettings selects an explicit safe column list (no `*`, no password)", () => {
    // Find the getSmtpSettings block and inspect its .select(...) call.
    const block = mailer.split("export const getSmtpSettings")[1]?.split("export const")[0] ?? "";
    expect(block).toBeTruthy();
    const selectMatch = block.match(/\.select\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    expect(selectMatch, "getSmtpSettings must call .select() with explicit columns").not.toBeNull();
    const cols = selectMatch![1];
    expect(cols).not.toMatch(/\*/);
    expect(cols).not.toMatch(/smtp_password/);
    expect(cols).toMatch(/sender_email/);
  });

  it("getSmtpSettings returns smtp_configured to the client", () => {
    const block = mailer.split("export const getSmtpSettings")[1]?.split("export const")[0] ?? "";
    expect(block).toMatch(/smtp_configured:\s*false/);
    expect(block).toMatch(/smtp_configured:\s*true/);
  });

  it("no console logging of the smtp row or password anywhere in mailer", () => {
    // Catch any `console.*(...smtp...)` calls that could leak the row.
    const consoleCalls = mailer.match(/console\.\w+\([^)]*\)/g) ?? [];
    for (const call of consoleCalls) {
      expect(call.toLowerCase()).not.toMatch(/smtp_password|smtp\b|password|smtp\.|\bsmtp\b/);
    }
  });
});

describe("smtp_password isolation — response schema", () => {
  it("rejects responses that include smtp_password", () => {
    expect(() =>
      SmtpSettingsResponseSchema.parse({
        smtp_configured: true,
        sender_email: "a@b.com",
        sender_name: null,
        smtp_host: "smtp.gmail.com",
        smtp_port: 587,
        updated_at: new Date().toISOString(),
        smtp_password: "leaked",
      }),
    ).toThrow();
  });

  it("rejects an unconfigured response that carries extra fields", () => {
    expect(() =>
      SmtpSettingsResponseSchema.parse({ smtp_configured: false, smtp_password: "x" }),
    ).toThrow();
  });

  it("accepts the safe configured shape", () => {
    const parsed = SmtpSettingsResponseSchema.parse({
      smtp_configured: true,
      sender_email: "a@b.com",
      sender_name: "Me",
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      updated_at: new Date().toISOString(),
    });
    expect(parsed).not.toHaveProperty("smtp_password");
  });

  it("accepts the unconfigured shape", () => {
    const parsed = SmtpSettingsResponseSchema.parse({ smtp_configured: false });
    expect(parsed).toEqual({ smtp_configured: false });
  });
});
