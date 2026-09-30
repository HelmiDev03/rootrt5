"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { buildDocHtml, markDiagrams, startEditing } from "@/lib/doc-editing";
import { CodeIcon, DocIcon, DownloadIcon, ExternalIcon, GithubIcon, PencilIcon, SaveIcon } from "./icons";
import { PasswordDialog } from "./password-dialog";
import { StatementMenu } from "./statement-menu";
import { ThemeToggle } from "./theme-toggle";

// The code view (with the Monaco editor) is only downloaded when it is opened.
const CodeViewer = dynamic(() => import("./code-viewer"), { ssr: false });

type View = "doc" | "code";
type EditStatus = "clean" | "dirty" | "saving" | "saved" | "conflict" | "error";

const STATUS_TEXT: Record<EditStatus, string> = {
  clean: "Aucune modification",
  dirty: "Modifications non enregistrées",
  saving: "Enregistrement…",
  saved: "Enregistré dans doc.html",
  conflict: "doc.html a été modifié ailleurs (VS Code ?)",
  error: "Erreur : doc.html n’a pas pu être enregistré",
};

const LEAVE_WARNING = "Les modifications non enregistrées de doc.html seront perdues. Continuer ?";

type RoomProps = {
  subject: { title: string; href: string };
  work: {
    folder: string;
    title?: string;
    docUrl: string | null;
    /** URL of the work's folder on the site, where its files are served. */
    base: string;
    /** The work's files, relative to its folder, for the code view. */
    files: string[];
    githubUrl: string;
    /** Files of the work's "enonce" folder. */
    statement: { name: string; url: string }[];
  };
  /** Slugs used to save doc.html; null when editing is off (outside `next dev`, or no doc.html). */
  edit: { subject: string; work: string } | null;
};

// The active view lives in the URL hash (#doc / #code) so it can be linked and survives a reload.
// "#code/<path>" also opens a file or folder of the work in the code view.
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function codePath(hash: string): string | undefined {
  if (!hash.startsWith("#code/")) return undefined;
  try {
    return decodeURIComponent(hash.slice("#code/".length));
  } catch {
    return undefined;
  }
}

export function Room({ subject, work, edit }: RoomProps) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  const view: View = hash.startsWith("#code") ? "code" : hash === "#doc" ? "doc" : work.docUrl ? "doc" : "code";

  // Load the code view the first time it is opened, then keep it alive (open tabs, folders).
  const [codeLoaded, setCodeLoaded] = useState(false);
  if (view === "code" && !codeLoaded) setCodeLoaded(true);

  const docFrame = useRef<HTMLIFrameElement>(null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<EditStatus>("clean");
  // The file as saved on disk (parsed, scripts not run) and its last-modified time.
  const original = useRef<Document | null>(null);
  const version = useRef(0);
  // The password is asked when the server refuses (not unlocked yet, or the session expired).
  const [askPassword, setAskPassword] = useState(false);
  const afterUnlock = useRef<"begin" | "save">("begin");

  function needPassword(next: "begin" | "save") {
    afterUnlock.current = next;
    setAskPassword(true);
  }

  async function beginEditing() {
    if (!edit) return;
    try {
      const res = await fetch(`/api/doc?subject=${encodeURIComponent(edit.subject)}&work=${encodeURIComponent(edit.work)}`, {
        cache: "no-store",
      });
      if (res.status === 401) return needPassword("begin");
      if (!res.ok) throw new Error(res.statusText);
      const doc: { html: string; version: number } = await res.json();
      original.current = new DOMParser().parseFromString(doc.html, "text/html");
      version.current = doc.version;
      setStatus("clean");
      setDirty(false);
      setEditing(true);
    } catch {
      window.alert("Impossible de charger doc.html pour le modifier.");
    }
  }

  async function save(force = false) {
    const page = docFrame.current?.contentDocument;
    if (!edit || !page || !original.current) return;
    const html = buildDocHtml(page, original.current);
    setStatus("saving");
    try {
      const res = await fetch("/api/doc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...edit, html, version: version.current, force }),
      });
      if (res.status === 401) {
        setStatus("dirty");
        return needPassword("save");
      }
      if (res.status === 409) return setStatus("conflict");
      if (!res.ok) throw new Error(res.statusText);
      version.current = (await res.json()).version;
      original.current = new DOMParser().parseFromString(html, "text/html");
      markDiagrams(page); // the saved file now lists the diagrams in the page's order
      setDirty(false);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  // Leaving edit mode reloads the page, so code highlighting and diagrams are drawn again.
  function stopEditing(askFirst = true) {
    if (askFirst && dirty && !window.confirm(LEAVE_WARNING)) return;
    setEditing(false);
    setDirty(false);
    docFrame.current?.contentWindow?.location.reload();
  }

  const onPageInput = useEffectEvent(() => {
    setDirty(true);
    setStatus("dirty");
  });
  const onSaveShortcut = useEffectEvent(() => {
    if (dirty) save();
  });
  useEffect(() => {
    const page = docFrame.current?.contentDocument;
    if (!editing || !page) return;
    const stop = startEditing(page, { onInput: () => onPageInput(), onSave: () => onSaveShortcut() });
    // Ctrl+S (⌘S) also saves when the focus is outside the page.
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSaveShortcut();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      stop();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  // Warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function guardNavigation(event: MouseEvent) {
    if (dirty && !window.confirm(LEAVE_WARNING)) event.preventDefault();
  }

  // The browser's "Save as PDF" on the doc only; the doc prepares light-mode diagrams first when it can.
  function downloadPdf() {
    const page = docFrame.current?.contentWindow as (Window & { printDoc?: () => void }) | null | undefined;
    if (page?.printDoc) page.printDoc();
    else page?.print();
  }

  // The doc can be opened on its own in a new tab; the code view already fills this page.
  const openUrl = view === "doc" ? work.docUrl : null;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <Link href="/" onClick={guardNavigation} className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">
            RT5
          </Link>
          <span className="text-zinc-400">/</span>
          <Link
            href={subject.href}
            onClick={guardNavigation}
            className="truncate text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {subject.title}
          </Link>
          <span className="text-zinc-400">/</span>
          <span className="shrink-0 font-semibold">{work.folder}</span>
          {work.title && <span className="hidden truncate text-zinc-500 xl:inline">— {work.title}</span>}
        </nav>

        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900" role="tablist">
          <ViewTab href="#doc" active={view === "doc"} icon={<DocIcon />} label="Documentation" />
          <ViewTab href="#code" active={view === "code"} icon={<CodeIcon />} label="Code (VS Code)" />
        </div>

        <div className="flex items-center gap-1.5">
          {edit && view === "doc" && !editing && (
            <button type="button" onClick={beginEditing} className="btn" title="Modifier la documentation directement sur la page">
              <PencilIcon /> Éditer
            </button>
          )}
          {work.docUrl && view === "doc" && (
            <button type="button" onClick={downloadPdf} className="btn" title="Télécharger la documentation en PDF">
              <DownloadIcon /> PDF
            </button>
          )}
          <StatementMenu files={work.statement} />
          <a href={work.githubUrl} target="_blank" rel="noopener" title="Voir sur GitHub" className="btn px-2">
            <GithubIcon />
          </a>
          {openUrl && (
            <a href={openUrl} target="_blank" rel="noopener" className="btn">
              <ExternalIcon /> Nouvel onglet
            </a>
          )}
          <ThemeToggle />
        </div>
      </header>

      {editing && view === "doc" && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <PencilIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium text-indigo-900 dark:text-indigo-200">Mode édition</span>
          <span className="text-zinc-600 max-sm:hidden dark:text-zinc-400">Cliquez sur un texte pour le modifier.</span>
          <span
            role="status"
            className={`ml-auto text-xs ${
              status === "dirty"
                ? "text-amber-700 dark:text-amber-400"
                : status === "saved"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : status === "conflict" || status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-500"
            }`}
          >
            {STATUS_TEXT[status]}
          </span>
          {status === "conflict" ? (
            <>
              <button type="button" className="btn" onClick={() => stopEditing(false)} title="Abandonner vos modifications et afficher le fichier">
                Recharger
              </button>
              <button type="button" className="btn-primary" onClick={() => save(true)} title="Remplacer le fichier par votre version">
                Écraser
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              onClick={() => save()}
              disabled={!dirty || status === "saving"}
              title="Enregistrer (Ctrl+S)"
            >
              <SaveIcon /> Enregistrer
            </button>
          )}
          <button type="button" className="btn" onClick={() => stopEditing()}>
            Terminer
          </button>
        </div>
      )}

      {askPassword && (
        <PasswordDialog
          onCancel={() => setAskPassword(false)}
          onUnlocked={() => {
            setAskPassword(false);
            if (afterUnlock.current === "save") save();
            else beginEditing();
          }}
        />
      )}

      <main className="relative flex-1 bg-white dark:bg-zinc-950">
        {work.docUrl ? (
          <iframe
            ref={docFrame}
            src={work.docUrl}
            title={`Documentation ${work.folder}`}
            className={`absolute inset-0 size-full ${view === "doc" ? "" : "invisible"}`}
          />
        ) : (
          view === "doc" && (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
              <p>
                Pas encore de documentation pour ce TP.
                <br />
                Ajoutez un fichier <code className="font-mono">doc.html</code> dans son dossier.
              </p>
            </div>
          )
        )}
        {codeLoaded && (
          <div className={`absolute inset-0 ${view === "code" ? "" : "invisible"}`}>
            <CodeViewer files={work.files} base={work.base} rootName={work.folder} reveal={codePath(hash)} />
          </div>
        )}
      </main>
    </div>
  );
}

function ViewTab({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      role="tab"
      aria-selected={active}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
