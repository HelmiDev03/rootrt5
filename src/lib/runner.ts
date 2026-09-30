// Runs a file of a work inside the visitor's browser, nothing to install:
// Java with CheerpJ + ECJ, Python with Pyodide, JavaScript and TypeScript with esbuild.
// The engines are in public/runners/ and load from CDNs the first time they are used.
import { zipSync } from "fflate";

export type RunLanguage = "java" | "python" | "javascript" | "typescript";

export type RunEvent =
  | { type: "status"; text: string }
  | { type: "output"; text: string; stream?: "stderr" }
  | { type: "exit"; code: number; failure?: string };

type RunOptions = {
  language: RunLanguage;
  /** URL of the work's folder on the site, where each file is served. */
  base: string;
  /** Every file of the work, relative to its folder. */
  files: string[];
  entry: string;
  entryText: string;
  /** Lines read by the program (Python's input()). */
  stdin: string;
  onEvent: (event: RunEvent) => void;
};

// Files copied next to a Python program: its modules and the data it may read.
const PYTHON_FILES = /\.(py|txt|csv|tsv|json|dat|xml|ya?ml|ini|cfg)$/i;

export function runLanguage(path: string, text: string | undefined): RunLanguage | null {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "py") return "python";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "javascript";
  if (ext === "ts" || ext === "mts" || ext === "cts") return "typescript";
  if (ext === "java" && text && /\bvoid\s+main\s*\(/.test(text)) return "java";
  return null;
}

function fileUrl(base: string, path: string): string {
  return `${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Starts the program; returns a function that stops it. */
export function startRun(options: RunOptions): () => void {
  if (options.language === "java") return runJava(options);
  if (options.language === "python") return runPython(options);
  return runScript(options);
}

// Java: CheerpJ needs a page of its own, so it lives in a hidden iframe, kept between runs.
let javaFrame: Promise<HTMLIFrameElement> | null = null;

function javaRuntime(): Promise<HTMLIFrameElement> {
  javaFrame ??= new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.src = "/runners/java.html";
    frame.title = "Java";
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:-10px;top:-10px;width:1px;height:1px;border:0;opacity:0";
    frame.addEventListener("load", () => resolve(frame), { once: true });
    document.body.append(frame);
  });
  return javaFrame;
}

function runJava({ base, files, entry, entryText, onEvent }: RunOptions): () => void {
  const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(entryText)?.[1] ?? "";
  const folder = entry.slice(0, entry.lastIndexOf("/") + 1);
  const pkgPath = pkg ? `${pkg.replaceAll(".", "/")}/` : "";
  // The source root (e.g. src/main/java/): every Java file under it is compiled, like Maven does.
  const root = pkgPath && folder.endsWith(pkgPath) ? folder.slice(0, -pkgPath.length) : folder;
  const sources = files.filter((file) => file.endsWith(".java") && file.startsWith(root));
  const className = entry.slice(entry.lastIndexOf("/") + 1, -".java".length);
  const id = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  let stopped = false;

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.data?.id !== id) return;
    const message = event.data as RunEvent;
    onEvent(message);
    if (message.type === "exit") window.removeEventListener("message", onMessage);
  };
  window.addEventListener("message", onMessage);

  (async () => {
    // The sources, in their package folders (tn/insat/…), zipped for java.html.
    const entries: Record<string, Uint8Array> = {};
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(fileUrl(base, file));
        if (!res.ok) throw new Error(`Impossible de charger ${file}`);
        entries[file.slice(root.length)] = new Uint8Array(await res.arrayBuffer());
      }),
    );
    const frame = await javaRuntime();
    if (stopped) return;
    frame.contentWindow?.postMessage(
      { type: "run", id, zip: zipSync(entries), sources: Object.keys(entries), mainClass: pkg ? `${pkg}.${className}` : className },
      location.origin,
    );
  })().catch((error: Error) => {
    onEvent({ type: "output", stream: "stderr", text: `${error.message}\n` });
    onEvent({ type: "exit", code: 1 });
  });

  return () => {
    stopped = true;
    window.removeEventListener("message", onMessage);
    // Stopping throws this Java runtime away; the next run starts a new one.
    javaFrame?.then((frame) => frame.remove());
    javaFrame = null;
  };
}

// Python: one worker, kept between runs so Pyodide loads once.
let pythonWorker: Worker | null = null;

function runPython({ base, files, entry, stdin, onEvent }: RunOptions): () => void {
  pythonWorker ??= new Worker("/runners/python-worker.js");
  const worker = pythonWorker;
  const onMessage = (event: MessageEvent<RunEvent>) => {
    onEvent(event.data);
    if (event.data.type === "exit") worker.removeEventListener("message", onMessage);
  };
  worker.addEventListener("message", onMessage);
  worker.postMessage({
    type: "run",
    entry,
    stdin,
    files: files.filter((file) => PYTHON_FILES.test(file)).map((path) => ({ path, url: fileUrl(base, path) })),
  });

  return () => {
    worker.removeEventListener("message", onMessage);
    worker.terminate();
    if (pythonWorker === worker) pythonWorker = null;
  };
}

// JavaScript / TypeScript: a new worker for each run, so nothing is left from the previous one
// (its timers keep printing until the next run or until it is stopped).
let scriptWorker: Worker | null = null;

function runScript({ base, files, entry, onEvent }: RunOptions): () => void {
  scriptWorker?.terminate();
  const worker = new Worker("/runners/js-worker.js", { type: "module" });
  scriptWorker = worker;
  worker.onmessage = (event: MessageEvent<RunEvent>) => onEvent(event.data);
  worker.onerror = (event) => {
    onEvent({ type: "output", stream: "stderr", text: `${event.message}\n` });
    onEvent({ type: "exit", code: 1 });
  };
  worker.postMessage({ type: "run", files, entry, base });

  return () => {
    worker.terminate();
    if (scriptWorker === worker) scriptWorker = null;
  };
}
