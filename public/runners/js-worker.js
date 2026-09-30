// Runs JavaScript and TypeScript inside the browser for the code view of the RT5 site.
// esbuild (in WebAssembly) compiles the file and the work's files it imports into one module,
// which then runs in this worker (one worker per run). Packages from npm come from esm.sh.
import * as esbuild from "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.28.2/esm/browser.min.js";

const WASM = "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.28.2/esbuild.wasm";
const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx", ".json", "/index.ts", "/index.js"];
const LOADERS = { ts: "ts", mts: "ts", cts: "ts", tsx: "tsx", js: "js", mjs: "js", cjs: "js", jsx: "jsx", json: "json" };
const NODE_ONLY = new Set([
  "fs", "path", "http", "https", "os", "child_process", "net", "readline", "stream", "zlib", "cluster",
  "dns", "tls", "dgram", "worker_threads", "perf_hooks", "vm", "module", "inspector", "repl", "tty",
]);

const post = (message) => self.postMessage(message);

// Like Node.js, the program ends when its code has run and no timer is left
// (a setInterval keeps it running until it is cleared or the run is stopped).
const timers = new Set();
let codeDone = false;
let exited = false;

function exit(code, failure) {
  if (exited) return;
  exited = true;
  post({ type: "exit", code, failure });
}

function endIfIdle() {
  if (codeDone && timers.size === 0) exit(0);
}

const nativeSetTimeout = self.setTimeout.bind(self);
const nativeSetInterval = self.setInterval.bind(self);
const nativeClearTimeout = self.clearTimeout.bind(self);
const nativeClearInterval = self.clearInterval.bind(self);
self.setTimeout = (callback, delay, ...args) => {
  const id = nativeSetTimeout(() => {
    timers.delete(id);
    try {
      if (typeof callback === "function") callback(...args);
    } finally {
      endIfIdle();
    }
  }, delay);
  timers.add(id);
  return id;
};
self.setInterval = (callback, delay, ...args) => {
  const id = nativeSetInterval(callback, delay, ...args);
  timers.add(id);
  return id;
};
self.clearTimeout = (id) => {
  nativeClearTimeout(id);
  timers.delete(id);
  endIfIdle();
};
self.clearInterval = (id) => {
  nativeClearInterval(id);
  timers.delete(id);
  endIfIdle();
};

function show(value) {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack || String(value);
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value === "bigint") return `${value}n`;
  if (value === undefined || typeof value === "symbol") return String(value);
  try {
    return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? `${v}n` : v), 2) ?? String(value);
  } catch {
    return String(value);
  }
}
const write = (stream) => (...args) => post({ type: "output", stream, text: args.map(show).join(" ") + "\n" });
console.log = console.info = console.debug = console.table = write("stdout");
console.error = console.warn = console.trace = write("stderr");

// The little of Node's "process" that console programs commonly use.
self.process = {
  argv: ["node", "main"],
  env: {},
  platform: "browser",
  stdout: { write: (text) => (post({ type: "output", text: String(text) }), true) },
  stderr: { write: (text) => (post({ type: "output", stream: "stderr", text: String(text) }), true) },
  exit: (code = 0) => {
    exit(code);
    self.close();
  },
};

self.addEventListener("error", (event) => post({ type: "output", stream: "stderr", text: show(event.error ?? event.message) + "\n" }));
self.addEventListener("unhandledrejection", (event) =>
  post({ type: "output", stream: "stderr", text: "Uncaught (in promise) " + show(event.reason) + "\n" }),
);

function dirname(path) {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

function join(dir, relative) {
  const parts = dir ? dir.split("/") : [];
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/");
}

self.onmessage = async (event) => {
  const { type, files, entry, base } = event.data;
  if (type !== "run") return;
  const known = new Set(files);
  try {
    post({ type: "status", text: `Compilation de ${entry}…` });
    await esbuild.initialize({ wasmURL: WASM, worker: false });

    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      target: "es2022",
      logLevel: "silent",
      plugins: [
        {
          name: "rt5-work-files",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (args.kind === "entry-point") return { path: args.path, namespace: "work" };
              if (args.path.startsWith(".") || args.path.startsWith("/")) {
                const wanted = args.path.startsWith("/") ? args.path.slice(1) : join(dirname(args.importer), args.path);
                const found = EXTENSIONS.map((ext) => wanted + ext).find((path) => known.has(path));
                return found
                  ? { path: found, namespace: "work" }
                  : { errors: [{ text: `Fichier introuvable : ${args.path}` }] };
              }
              const name = args.path.replace(/^node:/, "").split("/")[0];
              if (args.path.startsWith("node:") || NODE_ONLY.has(name)) {
                return { errors: [{ text: `Le module Node.js « ${args.path} » n’existe pas dans le navigateur.` }] };
              }
              return { path: `https://esm.sh/${args.path}`, external: true };
            });
            build.onLoad({ filter: /.*/, namespace: "work" }, async (args) => {
              const res = await fetch(`${base}/${args.path.split("/").map(encodeURIComponent).join("/")}`);
              if (!res.ok) return { errors: [{ text: `Impossible de charger ${args.path}` }] };
              return { contents: await res.text(), loader: LOADERS[args.path.split(".").pop()] ?? "js" };
            });
          },
        },
      ],
    });

    post({ type: "status", text: `Exécution de ${entry}` });
    const url = URL.createObjectURL(new Blob([result.outputFiles[0].text], { type: "text/javascript" }));
    await import(url);
    codeDone = true;
    endIfIdle();
  } catch (error) {
    const messages = error?.errors?.length
      ? error.errors.map((e) => (e.location ? `${e.location.file}:${e.location.line}:${e.location.column + 1} ` : "") + e.text)
      : [show(error)];
    post({ type: "output", stream: "stderr", text: messages.join("\n") + "\n" });
    exit(1, error?.errors ? "compile" : undefined);
  }
};
