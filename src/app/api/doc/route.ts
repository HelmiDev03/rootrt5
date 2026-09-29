import fs from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { DOC_FILE, getWork } from "@/lib/content";
import { EDITING_ENABLED, hasSession, isSameOrigin } from "@/lib/edit-auth";

// Reads and saves doc.html for in-browser editing, once the password was entered (see edit-auth.ts).
const MAX_SIZE = 5 * 1024 * 1024;

type SaveBody = { subject?: unknown; work?: unknown; html?: unknown; version?: unknown; force?: unknown };

function docPath(subject: unknown, work: unknown): string | null {
  if (typeof subject !== "string" || typeof work !== "string") return null;
  const found = getWork(subject, work);
  return found?.work.hasDoc ? path.join(/*turbopackIgnore: true*/ found.work.dir, DOC_FILE) : null;
}

/** null when the request may go on, otherwise the error response. */
function refuse(request: NextRequest): Response | null {
  if (!EDITING_ENABLED) return Response.json({ error: "Introuvable" }, { status: 404 });
  if (!isSameOrigin(request)) return Response.json({ error: "Interdit" }, { status: 403 });
  if (!hasSession(request)) return Response.json({ error: "Mot de passe requis" }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const refused = refuse(request);
  if (refused) return refused;

  const params = request.nextUrl.searchParams;
  const file = docPath(params.get("subject"), params.get("work"));
  if (!file) return Response.json({ error: "Introuvable" }, { status: 404 });

  const [html, stat] = await Promise.all([
    fs.readFile(/*turbopackIgnore: true*/ file, "utf8"),
    fs.stat(/*turbopackIgnore: true*/ file),
  ]);
  return Response.json({ html, version: stat.mtimeMs });
}

export async function PUT(request: NextRequest) {
  const refused = refuse(request);
  if (refused) return refused;

  const body: SaveBody | null = await request.json().catch(() => null);
  const file = docPath(body?.subject, body?.work);
  if (!file) return Response.json({ error: "Introuvable" }, { status: 404 });
  if (typeof body?.html !== "string" || body.html.length > MAX_SIZE) {
    return Response.json({ error: "Contenu invalide" }, { status: 400 });
  }

  // Don't silently overwrite a version saved elsewhere (e.g. from VS Code) unless asked to.
  const current = await fs.stat(/*turbopackIgnore: true*/ file);
  if (body.force !== true && current.mtimeMs !== body.version) {
    return Response.json({ error: "Le fichier a été modifié ailleurs" }, { status: 409 });
  }

  await fs.writeFile(/*turbopackIgnore: true*/ file, body.html, "utf8");
  return Response.json({ version: (await fs.stat(/*turbopackIgnore: true*/ file)).mtimeMs });
}
