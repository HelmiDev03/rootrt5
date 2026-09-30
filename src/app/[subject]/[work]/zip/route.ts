import fs from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { getSubjects, getWork, listWorkFiles } from "@/lib/content";

// The work's folder as a .zip (e.g. TP1.zip), without build output such as target/.
export function generateStaticParams() {
  return getSubjects().flatMap((subject) =>
    subject.works.map((work) => ({ subject: subject.slug, work: work.slug })),
  );
}

export async function GET(_request: Request, { params }: RouteContext<"/[subject]/[work]/zip">) {
  const { subject, work } = await params;
  const found = getWork(subject, work);
  if (!found) return new Response("Not found", { status: 404 });

  const { folder, dir } = found.work;
  const entries: Record<string, Uint8Array> = {};
  for (const file of listWorkFiles(dir)) {
    entries[`${folder}/${file}`] = new Uint8Array(await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, file)));
  }
  return new Response(new Uint8Array(zipSync(entries, { level: 6 })), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(folder)}.zip`,
    },
  });
}
