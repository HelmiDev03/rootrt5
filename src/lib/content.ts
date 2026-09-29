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
  codeUrl: string;
  githubUrl: string;
};

export type Subject = {
  folder: string;
  slug: string;
  title: string;
  works: Work[];
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
// Build output and dependencies are never served from a work folder.
const SKIPPED_DIRS = new Set(["node_modules", "target", "build", "dist", "out", "bin", "obj", "__pycache__", "venv"]);
const SERVED_EXTENSIONS = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf"]);

// The statement of a work (one or several files of any type) goes in its "enonce" folder;
// "Enonce" or "énoncé" work too.
function isStatementDir(name: string): boolean {
  return slugify(name) === "enonce";
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

function githubLink(host: string, relPath: string): string {
  const { owner, repo, branch } = site.github;
  const encoded = relPath.split("/").map(encodeURIComponent).join("/");
  return `https://${host}/${owner}/${repo}/tree/${branch}/${encoded}`;
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
    codeUrl: githubLink("github1s.com", `${subjectFolder}/${folder}`),
    githubUrl: githubLink("github.com", `${subjectFolder}/${folder}`),
  };
}

/** Every top-level folder is a subject, and every folder inside a subject is a work (TP1, TP2…). */
export function getSubjects(): Subject[] {
  return listDirs(contentPath())
    .filter((name) => !APP_DIRS.has(name))
    .map((folder) => {
      const title = site.subjectTitles[folder.normalize("NFC")] ?? titleFromFolder(folder);
      return {
        folder,
        slug: slugify(title),
        title,
        works: listDirs(contentPath(folder)).map((work) => readWork(folder, work)),
      };
    });
}

export function getSubject(slug: string): Subject | undefined {
  return getSubjects().find((subject) => subject.slug === slug);
}

export function getWork(subjectSlug: string, workSlug: string) {
  const subject = getSubject(subjectSlug);
  const work = subject?.works.find((w) => w.slug === workSlug);
  return subject && work ? { subject, work } : undefined;
}

/**
 * Files of a work served by the site (doc.html, its images, the statement…), relative to the work folder.
 * Inside the statement folder every file is served, whatever its type.
 */
export function listWorkFiles(dir: string, sub = "", anyType = false): string[] {
  return fs.readdirSync(path.join(/*turbopackIgnore: true*/ dir, sub), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const rel = sub ? `${sub}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) return [];
      return listWorkFiles(dir, rel, anyType || (!sub && isStatementDir(entry.name)));
    }
    return anyType || SERVED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [rel] : [];
  });
}

function statementFiles(dir: string): string[] {
  const folder = listDirs(dir).find(isStatementDir);
  const files = folder ? listWorkFiles(dir, folder, true) : [];
  return files.sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

export function countWorks(n: number): string {
  return n === 0 ? "Aucun TP pour l’instant" : `${n} TP`;
}
