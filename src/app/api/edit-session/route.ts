import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  EDITING_ENABLED,
  SESSION_COOKIE,
  SESSION_SECONDS,
  createSession,
  isPasswordCorrect,
  isSameOrigin,
} from "@/lib/edit-auth";

/** Unlocks editing for this browser when the right password is sent. */
export async function POST(request: NextRequest) {
  if (!EDITING_ENABLED) return Response.json({ error: "Introuvable" }, { status: 404 });
  if (!isSameOrigin(request)) return Response.json({ error: "Interdit" }, { status: 403 });

  const body: { password?: unknown } | null = await request.json().catch(() => null);
  if (typeof body?.password !== "string" || !isPasswordCorrect(body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // slows down guessing
    return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/api",
    maxAge: SESSION_SECONDS,
  });
  return new Response(null, { status: 204 });
}
