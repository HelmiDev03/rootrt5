import fs from "node:fs";
import path from "node:path";
import { site } from "@/site.config";

export type Work = {
  folder: string;
  slug: string;
  dir: string;
  /** From the <title> of doc.html, without the leading "TP1 —". */
  title?: string;
  description?: string;
  authors?: string;
  hasDoc: boolean;
  /** Statement files (énoncé): everything in the work's "enonce" folder, relative to the work folder. */
  statement: string[];
  githubUrl: string;
};

/** Course summaries of a subject (PDF, Word…): the files of its "Summary" folder, listed on the subject page. */
export type Summary = {
  folder: string;
  slug: string;
  dir: string;
  /** Relative to the summary folder, with their size in bytes. */
  files: { path: string; size: number }[];
};

export type Subject = {
  folder: string;
  slug: string;
  title: string;
  works: Work[];
  summary: Summary | null;
};

export const DOC_FILE = "doc.html";

const ROOT = process.cwd();

// Content is only read at build time (every route is prerendered), so the
// file tracer must not bundle the whole project into the server output.
function contentPath(...parts: string[]): string {
  return path.join(/*turbopackIgnore: true*/ ROOT, ...parts);
}

// Top-level folders that belong to the Next.js app rather than to a subject.
const APP_DIRS = new Set(["node_modules", "public", "src"]);
// Build output and dependencies are never shown or served from a work folder.
// tp_support/ holds course material (videos…) kept out of git, see .gitignore.
const SKIPPED_DIRS = new Set(["node_modules", "target", "build", "dist", "out", "bin", "obj", "__pycache__", "venv", "tp_support"]);

// The statement of a work (one or several files of any type) goes in its "enonce" folder;
// "Enonce" or "énoncé" work too.
function isStatementDir(name: string): boolean {
  return slugify(name) === "enonce";
}

// A subject's "Summary" folder ("Résumé" or "Résumés" work too) holds course summaries, not a TP.
function isSummaryDir(name: string): boolean {
  return /^(summary|summaries|resumes?)$/.test(slugify(name));
}

function listDirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[._]/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromFolder(folder: string): string {
  return folder.replace(/[_-]+/g, " ").replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2");
}

function githubLink(relPath: string): string {
  const { owner, repo, branch } = site.github;
  const encoded = relPath.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${owner}/${repo}/tree/${branch}/${encoded}`;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function readDocMeta(file: string) {
  const html = fs.readFileSync(file, "utf8");
  const pick = (pattern: RegExp) => {
    const value = html.match(pattern)?.[1].trim();
    return value ? decodeEntities(value) : undefined;
  };
  return {
    title: pick(/<title>([\s\S]*?)<\/title>/i),
    description: pick(/<meta\s+name="description"\s+content="([^"]*)"/i),
    authors: pick(/<meta\s+name="author"\s+content="([^"]*)"/i),
  };
}

function readWork(subjectFolder: string, folder: string): Work {
  const dir = contentPath(subjectFolder, folder);
  const hasDoc = fs.existsSync(contentPath(subjectFolder, folder, DOC_FILE));
  const meta = hasDoc ? readDocMeta(contentPath(subjectFolder, folder, DOC_FILE)) : undefined;

  let title = meta?.title;
  if (title?.toLowerCase().startsWith(folder.toLowerCase())) {
    title = title.slice(folder.length).replace(/^\s*[—–:-]\s*/, "") || undefined;
  }

  return {
    folder,
    slug: slugify(folder),
    dir,
    title,
    description: meta?.description,
    authors: meta?.authors,
    hasDoc,
    statement: statementFiles(dir),
    githubUrl: githubLink(`${subjectFolder}/${folder}`),
  };
}

function readSummary(subjectFolder: string, folder: string): Summary {
  const dir = contentPath(subjectFolder, folder);
  const files = listWorkFiles(dir)
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
    .map((file) => ({ path: file, size: fs.statSync(path.join(/*turbopackIgnore: true*/ dir, file)).size }));
  return { folder, slug: slugify(folder), dir, files };
}

/**
 * Every top-level folder is a subject, and every folder inside a subject is a work (TP1, TP2…),
 * except its "Summary" folder.
 */
export function getSubjects(): Subject[] {
  return listDirs(contentPath())
    .filter((name) => !APP_DIRS.has(name))
    .map((folder) => {
      const title = site.subjectTitles[folder.normalize("NFC")] ?? titleFromFolder(folder);
      const dirs = listDirs(contentPath(folder));
      const summary = dirs.find(isSummaryDir);
      return {
        folder,
        slug: slugify(title),
        title,
        works: dirs.filter((dir) => !isSummaryDir(dir)).map((work) => readWork(folder, work)),
        summary: summary ? readSummary(folder, summary) : null,
      };
    });
}

export function getSubject(slug: string): Subject | undefined {
  return getSubjects().find((subject) => subject.slug === slug);
}

/** The folder whose files are served under /<subject>/<slug>/…: a work, or the subject's summary folder. */
export function getServedFolder(subjectSlug: string, slug: string): string | undefined {
  const subject = getSubject(subjectSlug);
  if (subject?.summary?.slug === slug) return subject.summary.dir;
  return subject?.works.find((work) => work.slug === slug)?.dir;
}

export function getWork(subjectSlug: string, workSlug: string) {
  const subject = getSubject(subjectSlug);
  const work = subject?.works.find((w) => w.slug === workSlug);
  return subject && work ? { subject, work } : undefined;
}

/**
 * Files of a work, relative to its folder: shown in the code view and served by the site.
 * Hidden files and build output (target/, node_modules/…) are left out.
 */
export function listWorkFiles(dir: string, sub = ""): string[] {
  return fs.readdirSync(path.join(/*turbopackIgnore: true*/ dir, sub), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const rel = sub ? `${sub}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : listWorkFiles(dir, rel);
    return [rel];
  });
}

function statementFiles(dir: string): string[] {
  const folder = listDirs(dir).find(isStatementDir);
  const files = folder ? listWorkFiles(dir, folder) : [];
  return files.sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

export function countWorks(n: number): string {
  return n === 0 ? "Aucun TP pour l’instant" : `${n} TP`;
}

/** "2 TP · 1 résumé" */
export function subjectStats(subject: Subject): string {
  const summaries = subject.summary?.files.length ?? 0;
  const stats = [countWorks(subject.works.length)];
  if (summaries > 0) stats.push(summaries === 1 ? "1 résumé" : `${summaries} résumés`);
  return stats.join(" · ");
}
