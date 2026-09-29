import fs from "node:fs/promises";
import path from "node:path";
import { getSubjects, getWork, listWorkFiles } from "@/lib/content";

// Serves the files of a work (doc.html, its images, PDFs) next to the work's page,
// so relative links inside doc.html (e.g. docs/uml.png) resolve.
export function generateStaticParams() {
  return getSubjects().flatMap((subject) =>
    subject.works.flatMap((work) =>
      listWorkFiles(work.dir).map((file) => ({ subject: subject.slug, work: work.slug, file: file.split("/") })),
    ),
  );
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

function decode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function GET(_request: Request, { params }: RouteContext<"/[subject]/[work]/[...file]">) {
  const { subject, work, file } = await params;
  const found = getWork(subject, work);
  const rel = file.map(decode).join("/");

  if (!found || !listWorkFiles(found.work.dir).includes(rel)) {
    return new Response("Not found", { status: 404 });
  }

  const body = await fs.readFile(path.join(/*turbopackIgnore: true*/ found.work.dir, rel));
  const type = CONTENT_TYPES[path.extname(rel).toLowerCase()];
  const headers: Record<string, string> = { "Content-Type": type ?? "application/octet-stream" };
  // Files the browser can't show (Word, zip…) are downloaded under their own name.
  if (!type) headers["Content-Disposition"] = `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(rel))}`;
  return new Response(new Uint8Array(body), { headers });
}
