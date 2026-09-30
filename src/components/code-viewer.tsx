"use client";

import Editor from "@monaco-editor/react";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { runLanguage, startRun } from "@/lib/runner";
import { ExternalIcon, PlayIcon, StopIcon, TrashIcon } from "./icons";

// A read-only, VS Code-like view of one work's folder: explorer, tabs and the Monaco editor
// (the editor of VS Code). Files come from the site itself, so only this work is shown.

type FileNode = { name: string; path: string; children: null };
type FolderNode = { name: string; path: string; children: TreeNode[] };
type TreeNode = FileNode | FolderNode;

type CodeViewerProps = {
  /** Paths of the work's files, relative to its folder. */
  files: string[];
  /** URL of the work's folder on the site, where each file is served. */
  base: string;
  rootName: string;
  /** File or folder to show, from a `#code/<path>` link. */
  reveal?: string;
};

type Loaded = { text: string } | "binary" | "error";

type OutputPart = { kind: "info" | "out" | "err" | "ok" | "fail"; text: string };

const PART_CLASS: Record<OutputPart["kind"], string> = {
  info: "block text-[#8a8a8a]",
  out: "",
  err: "text-[#e51400] dark:text-[#f14c4c]",
  ok: "block text-[#388a34] dark:text-[#89d185]",
  fail: "block text-[#e51400] dark:text-[#f14c4c]",
};

// Keeps the panel responsive when a program prints without end.
const MAX_OUTPUT = 200_000;

function trimOutput(parts: OutputPart[]): OutputPart[] {
  let size = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    size += parts[i].text.length;
    if (size > MAX_OUTPUT) return [{ kind: "info", text: "… (début de la sortie coupé)" }, ...parts.slice(i + 1)];
  }
  return parts;
}

const ACTION_CLASS = "flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10";

const IMAGES = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"]);
const BINARIES = new Set([
  "class", "jar", "war", "ear", "zip", "gz", "tar", "7z", "rar", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "odt", "exe", "dll", "so", "dylib", "bin", "mp3", "mp4", "wav", "mov", "avi", "woff", "woff2", "ttf", "otf",
]);
const ICON_COLORS: Record<string, string> = {
  java: "#e76f00", xml: "#f1662a", html: "#e44d26", css: "#42a5f5", js: "#e8c547", mjs: "#e8c547",
  ts: "#3178c6", tsx: "#3178c6", jsx: "#61dafb", json: "#cbcb41", md: "#519aba", py: "#3572a5",
  yml: "#cb171e", yaml: "#cb171e", sql: "#e38c00", pdf: "#e53935", png: "#a074c4", jpg: "#a074c4",
  jpeg: "#a074c4", gif: "#a074c4", svg: "#ffb13b", webp: "#a074c4",
};
const LANGUAGES: Record<string, string> = {
  java: "Java", xml: "XML", html: "HTML", css: "CSS", js: "JavaScript", mjs: "JavaScript", ts: "TypeScript",
  tsx: "TypeScript JSX", jsx: "JavaScript JSX", json: "JSON", md: "Markdown", py: "Python", sql: "SQL",
  yml: "YAML", yaml: "YAML", properties: "Properties", sh: "Shell", txt: "Texte", c: "C", h: "C",
  cpp: "C++", cs: "C#", go: "Go", kt: "Kotlin", php: "PHP", rb: "Ruby", rs: "Rust", dockerfile: "Dockerfile",
};

function extension(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  if (name === "dockerfile") return name;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : "";
}

function kindOf(path: string): "text" | "image" | "pdf" | "binary" {
  const ext = extension(path);
  if (IMAGES.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return BINARIES.has(ext) ? "binary" : "text";
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function fileUrl(base: string, path: string): string {
  return `${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** "a/b/c.java" → ["a", "a/b"] */
function parentFolders(path: string): string[] {
  const parts = path.split("/");
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
}

function buildTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.split("/");
    let level = root;
    parts.forEach((name, i) => {
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === name && (n.children === null) === isFile);
      if (!node) {
        const path = parts.slice(0, i + 1).join("/");
        node = isFile ? { name, path, children: null } : { name, path, children: [] };
        level.push(node);
      }
      if (node.children) level = node.children;
    });
  }
  sortTree(root);
  return root;
}

// Folders first, then files, by name, like VS Code.
function sortTree(nodes: TreeNode[]) {
  nodes.sort(
    (a, b) =>
      Number(a.children === null) - Number(b.children === null) ||
      a.name.localeCompare(b.name, "fr", { numeric: true, sensitivity: "base" }),
  );
  for (const node of nodes) if (node.children) sortTree(node.children);
}

// Follows the site's light / dark class on <html>.
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} fill="currentColor" aria-hidden="true">
      <path d="M6 4l4 4-4 4z" />
    </svg>
  );
}

function FileGlyph({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke={ICON_COLORS[extension(path)] ?? "#8a8a8a"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function rowClass(selected: boolean): string {
  return `flex w-full items-center gap-1.5 py-[3px] pr-2 text-left text-[13px] leading-5 ${
    selected ? "bg-[#e4e6f1] dark:bg-[#37373d]" : "hover:bg-[#e8e8e8] dark:hover:bg-[#2a2d2e]"
  }`;
}

export default function CodeViewer({ files, base, rootName, reveal }: CodeViewerProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.classList.contains("dark"), () => false);
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 640);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());
  const treeRef = useRef<HTMLDivElement>(null);

  function open(path: string) {
    setTabs((current) => (current.includes(path) ? current : [...current, path]));
    setActive(path);
    setSelected(path);
  }

  function close(path: string) {
    const rest = tabs.filter((tab) => tab !== path);
    setTabs(rest);
    if (active === path) {
      const next = rest[Math.min(tabs.indexOf(path), rest.length - 1)] ?? null;
      setActive(next);
      setSelected(next);
    }
  }

  function toggle(path: string) {
    setSelected(path);
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });
  }

  // A #code/<path> link (e.g. from the documentation): open the file, or unfold the folder.
  const [revealed, setRevealed] = useState<string | undefined>(undefined);
  if (reveal !== revealed) {
    setRevealed(reveal);
    if (reveal) {
      const isFile = files.includes(reveal);
      setExpanded((current) => new Set([...current, ...parentFolders(reveal), ...(isFile ? [] : [reveal])]));
      setSidebar(true);
      if (isFile) open(reveal);
      else setSelected(reveal);
    }
  }

  // Text files are downloaded the first time they are opened.
  useEffect(() => {
    if (!active || kindOf(active) !== "text" || requested.current.has(active)) return;
    requested.current.add(active);
    const path = active;
    fetch(fileUrl(base, path))
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.statusText))))
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        const content: Loaded = bytes.subarray(0, 8000).includes(0) ? "binary" : { text: new TextDecoder().decode(bytes) };
        setLoaded((all) => ({ ...all, [path]: content }));
      })
      .catch(() => setLoaded((all) => ({ ...all, [path]: "error" })));
  }, [active, base]);

  // Keep the selected row in view.
  useEffect(() => {
    if (selected) treeRef.current?.querySelector(`[data-path="${CSS.escape(selected)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  // ▶ Exécuter: the program runs in the browser (see lib/runner.ts), its output goes to the panel.
  const [panel, setPanel] = useState(false);
  const [output, setOutput] = useState<OutputPart[]>([]);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [stdinOpen, setStdinOpen] = useState(false);
  const stopRun = useRef<(() => void) | null>(null);
  const runId = useRef(0);
  const pending = useRef<OutputPart[]>([]);
  const outputRef = useRef<HTMLPreElement>(null);

  // Output comes in many small pieces: add them to the panel once per frame.
  function append(part: OutputPart) {
    if (pending.current.push(part) > 1) return;
    requestAnimationFrame(() => {
      const parts = pending.current;
      pending.current = [];
      setOutput((all) => trimOutput([...all, ...parts]));
    });
  }

  function run(entry: string, entryText: string, language: NonNullable<ReturnType<typeof runLanguage>>) {
    const id = ++runId.current;
    const started = performance.now();
    pending.current = [];
    setOutput([{ kind: "info", text: `▶ ${entry}` }]);
    setPanel(true);
    setRunning(true);
    stopRun.current = startRun({
      language,
      base,
      files,
      entry,
      entryText,
      stdin,
      onEvent: (event) => {
        if (runId.current !== id) return;
        if (event.type === "status") append({ kind: "info", text: event.text });
        else if (event.type === "output") append({ kind: event.stream === "stderr" ? "err" : "out", text: event.text });
        else {
          setRunning(false);
          const seconds = ((performance.now() - started) / 1000).toFixed(1).replace(".", ",");
          if (event.code === 0) append({ kind: "ok", text: `✔ Terminé en ${seconds} s` });
          else if (event.failure === "compile") append({ kind: "fail", text: "✘ Erreur de compilation" });
          else append({ kind: "fail", text: `✘ Terminé avec le code ${event.code} (${seconds} s)` });
        }
      },
    });
  }

  function stop() {
    runId.current++;
    stopRun.current?.();
    stopRun.current = null;
    setRunning(false);
    append({ kind: "fail", text: "■ Programme arrêté" });
  }

  // Leaving the page stops a program that is still running.
  useEffect(() => () => stopRun.current?.(), []);

  useEffect(() => {
    const element = outputRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [output]);

  function renderNodes(nodes: TreeNode[], depth: number): ReactNode {
    return nodes.map((node) => {
      if (node.children === null) {
        return (
          <button
            key={node.path}
            type="button"
            role="treeitem"
            aria-selected={selected === node.path}
            data-path={node.path}
            onClick={() => open(node.path)}
            className={rowClass(selected === node.path)}
            style={{ paddingLeft: 24 + depth * 12 }}
          >
            <FileGlyph path={node.path} />
            <span className="truncate">{node.name}</span>
          </button>
        );
      }
      // A chain of single folders is one row, like VS Code: "src/main/java/tn/insat/tp1".
      let folder: FolderNode = node;
      let label = node.name;
      while (folder.children.length === 1) {
        const only = folder.children[0];
        if (only.children === null) break;
        folder = only;
        label += `/${only.name}`;
      }
      const isOpen = expanded.has(folder.path);
      const folderPath = folder.path;
      return (
        <Fragment key={node.path}>
          <button
            type="button"
            role="treeitem"
            aria-expanded={isOpen}
            aria-selected={selected === folderPath}
            data-path={folderPath}
            onClick={() => toggle(folderPath)}
            className={rowClass(selected === folderPath)}
            style={{ paddingLeft: 6 + depth * 12 }}
          >
            <Chevron open={isOpen} />
            <span className="truncate">{label}</span>
          </button>
          {isOpen && renderNodes(folder.children, depth + 1)}
        </Fragment>
      );
    });
  }

  const content = active ? loaded[active] : undefined;
  const kind = active ? kindOf(active) : null;
  const ext = active ? extension(active) : "";
  const text = typeof content === "object" ? content.text : undefined;
  const language = active ? runLanguage(active, text) : null;

  return (
    <div className="flex h-full flex-col bg-white text-[#3b3b3b] dark:bg-[#1e1e1e] dark:text-[#cccccc]">
      <div className="flex min-h-0 flex-1">
        {/* Activity bar */}
        <div className="flex w-12 shrink-0 flex-col border-r border-[#e5e5e5] bg-[#f8f8f8] dark:border-[#2b2b2b] dark:bg-[#181818]">
          <button
            type="button"
            onClick={() => setSidebar(!sidebar)}
            aria-pressed={sidebar}
            title="Explorateur"
            className={`grid h-12 place-items-center border-l-2 ${
              sidebar
                ? "border-[#005fb8] text-[#1f1f1f] dark:border-[#0078d4] dark:text-white"
                : "border-transparent text-[#868686] hover:text-[#1f1f1f] dark:hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path d="M15 2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6z" />
              <path d="M15 2v4h4" />
              <path d="M5 6H4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h10a1 1 0 0 0 1-1v-1" />
            </svg>
          </button>
        </div>

        {/* Explorer */}
        {sidebar && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-[#e5e5e5] bg-[#f8f8f8] max-sm:w-52 dark:border-[#2b2b2b] dark:bg-[#181818]">
            <p className="px-5 py-2.5 text-[11px] tracking-wide text-[#616161] dark:text-[#bbbbbb]">EXPLORATEUR</p>
            <p className="flex items-center gap-0.5 px-1.5 pb-1 text-[11px] font-bold uppercase">
              <Chevron open /> {rootName}
            </p>
            <div ref={treeRef} role="tree" aria-label={`Fichiers de ${rootName}`} className="min-h-0 flex-1 overflow-y-auto pb-4">
              {renderNodes(tree, 0)}
            </div>
          </aside>
        )}

        {/* Editor area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {tabs.length > 0 && (
            <div className="flex h-9 shrink-0 bg-[#f8f8f8] dark:bg-[#181818]">
            <div className="flex min-w-0 flex-1 overflow-x-auto" role="tablist">
              {tabs.map((path) => {
                const isActive = path === active;
                return (
                  <div
                    key={path}
                    className={`group flex shrink-0 items-center gap-1 border-r border-[#e5e5e5] pl-3 pr-1 text-[13px] dark:border-[#2b2b2b] ${
                      isActive
                        ? "bg-white text-[#333333] shadow-[inset_0_1px_0_#005fb8] dark:bg-[#1e1e1e] dark:text-white dark:shadow-[inset_0_1px_0_#0078d4]"
                        : "text-[#616161] dark:text-[#9d9d9d]"
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      title={path}
                      onClick={() => {
                        setActive(path);
                        setSelected(path);
                      }}
                      className="flex h-full items-center gap-1.5"
                    >
                      <FileGlyph path={path} />
                      {fileName(path)}
                      {/* Two open files with the same name: show their folder, like VS Code. */}
                      {tabs.some((tab) => tab !== path && fileName(tab) === fileName(path)) && (
                        <span className="text-[11px] opacity-60">{path.split("/").slice(-2, -1)[0] ?? rootName}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Fermer ${fileName(path)}`}
                      onClick={() => close(path)}
                      className={`grid size-5 place-items-center rounded text-base leading-none hover:bg-black/10 dark:hover:bg-white/10 ${
                        isActive ? "" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Editor actions, on the right like in VS Code */}
            <div className="flex shrink-0 items-center gap-1 px-2">
              {running ? (
                <button type="button" onClick={stop} className={ACTION_CLASS} title="Arrêter le programme">
                  <StopIcon className="size-3.5 text-[#e51400] dark:text-[#f14c4c]" /> Arrêter
                </button>
              ) : (
                active &&
                language &&
                text !== undefined && (
                  <button
                    type="button"
                    onClick={() => run(active, text, language)}
                    className="flex items-center gap-1.5 rounded bg-[#2ea043] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#3fb950]"
                    title={`Exécuter ${fileName(active)} dans le navigateur`}
                  >
                    <PlayIcon className="size-3.5" /> Exécuter
                  </button>
                )
              )}
              {active && (ext === "html" || ext === "htm") && (
                <a href={fileUrl(base, active)} target="_blank" rel="noopener" className={ACTION_CLASS} title="Ouvrir la page dans un nouvel onglet">
                  <ExternalIcon className="size-3.5" /> Aperçu
                </a>
              )}
            </div>
            </div>
          )}

          {active && (
            <div className="flex h-6 shrink-0 items-center gap-1 overflow-hidden whitespace-nowrap px-4 text-xs text-[#616161] dark:text-[#a9a9a9]">
              {[rootName, ...active.split("/")].map((part, i, parts) => (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden="true">›</span>}
                  <span className={i === parts.length - 1 ? "text-[#3b3b3b] dark:text-[#cccccc]" : ""}>{part}</span>
                </Fragment>
              ))}
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            {!active ? (
              <div className="grid h-full place-items-center p-6 text-center text-sm text-[#8a8a8a]">
                <div>
                  <svg viewBox="0 0 24 24" className="mx-auto mb-4 size-16 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
                    <path d="m16 18 6-6-6-6" />
                    <path d="m8 6-6 6 6 6" />
                  </svg>
                  Sélectionnez un fichier dans l’explorateur.
                </div>
              </div>
            ) : kind === "image" ? (
              <div className="grid h-full place-items-center overflow-auto p-6">
                {/* A raw file preview: no image optimization needed. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(base, active)} alt={fileName(active)} className="max-h-full max-w-full" />
              </div>
            ) : kind === "pdf" ? (
              <iframe src={fileUrl(base, active)} title={fileName(active)} className="size-full" />
            ) : kind === "binary" || content === "binary" ? (
              <div className="grid h-full place-items-center p-6 text-center text-sm">
                <p>
                  Ce fichier n’est pas du texte.
                  <br />
                  <a href={fileUrl(base, active)} download className="mt-2 inline-block text-[#005fb8] hover:underline dark:text-[#4daafc]">
                    Télécharger {fileName(active)}
                  </a>
                </p>
              </div>
            ) : content === "error" ? (
              <p className="p-6 text-sm text-red-600 dark:text-red-400">Impossible de charger ce fichier.</p>
            ) : !content ? (
              <p className="p-6 text-sm text-[#8a8a8a]">Chargement…</p>
            ) : (
              <Editor
                path={active}
                defaultValue={content.text}
                theme={dark ? "vs-dark" : "vs"}
                loading={<p className="p-6 text-sm text-[#8a8a8a]">Chargement de l’éditeur…</p>}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  automaticLayout: true,
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "all",
                  padding: { top: 6 },
                }}
              />
            )}
          </div>

          {/* Output panel, like VS Code's terminal */}
          {panel && (
            <div className="flex h-2/5 min-h-36 shrink-0 flex-col border-t border-[#e5e5e5] dark:border-[#2b2b2b]">
              <div className="flex h-8 shrink-0 items-center gap-4 px-4 text-[11px] uppercase tracking-wide">
                <span className="border-b border-[#005fb8] py-1.5 text-[#333333] dark:border-[#0078d4] dark:text-white">Sortie</span>
                {language === "python" && (
                  <button
                    type="button"
                    onClick={() => setStdinOpen(!stdinOpen)}
                    aria-pressed={stdinOpen}
                    title="Lignes lues par input()"
                    className={`py-1.5 uppercase ${stdinOpen ? "text-[#333333] dark:text-white" : "text-[#8a8a8a] hover:text-[#333333] dark:hover:text-white"}`}
                  >
                    Entrée
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => setOutput([])} title="Effacer la sortie" className={ACTION_CLASS}>
                    <TrashIcon className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setPanel(false)} title="Fermer le panneau" className={`${ACTION_CLASS} text-sm leading-none`}>
                    ×
                  </button>
                </div>
              </div>
              {stdinOpen && language === "python" && (
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  rows={3}
                  spellCheck={false}
                  aria-label="Entrée du programme"
                  placeholder="Lignes lues par input(), une par ligne (utilisées à la prochaine exécution)"
                  className="mx-4 mb-2 shrink-0 resize-y rounded border border-[#cecece] bg-white px-2 py-1 font-mono text-xs outline-none focus:border-[#005fb8] dark:border-[#3c3c3c] dark:bg-[#1e1e1e] dark:focus:border-[#0078d4]"
                />
              )}
              <pre
                ref={outputRef}
                className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words px-4 pb-3 font-mono text-[12.5px] leading-normal"
              >
                {output.map((part, i) => (
                  <span key={i} className={PART_CLASS[part.kind]}>
                    {part.text}
                  </span>
                ))}
              </pre>
            </div>
          )}
        </section>
      </div>

      {/* Status bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between bg-[#007acc] px-3 text-xs text-white">
        <span>
          {rootName} · Lecture seule{running ? " · ▶ Exécution…" : ""}
        </span>
        <span>{active && kind === "text" ? (LANGUAGES[ext] ?? (ext ? ext.toUpperCase() : "Texte")) : ""}</span>
      </footer>
    </div>
  );
}
