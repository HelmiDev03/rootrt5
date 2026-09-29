import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

// Editing writes the doc.html files on disk, so it only exists while running `next dev`, and only with
// the password set in .env.local (EDIT_PASSWORD), never in the code, which may be public on GitHub.
const PASSWORD = process.env.EDIT_PASSWORD ?? "";
export const EDITING_ENABLED = process.env.NODE_ENV === "development" && PASSWORD !== "";

export const SESSION_COOKIE = "rt5-edit";
export const SESSION_SECONDS = 12 * 60 * 60;

function sign(value: string): string {
  return createHmac("sha256", PASSWORD).update(value).digest("hex");
}

// Compares in constant time, whatever the lengths.
function sameText(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function isPasswordCorrect(input: string): boolean {
  return EDITING_ENABLED && sameText(input, PASSWORD);
}

/** Cookie value proving the password was entered: "<expiry>.<signature>". Changing the password revokes it. */
export function createSession(): string {
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function hasSession(request: NextRequest): boolean {
  const [expires = "", signature = ""] = (request.cookies.get(SESSION_COOKIE)?.value ?? "").split(".");
  return EDITING_ENABLED && Number(expires) > Date.now() && sameText(signature, sign(expires));
}

/** Rejects requests sent by another website open in the same browser. */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
