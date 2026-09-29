"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, FileIcon } from "./icons";

type StatementFile = { name: string; url: string };

// "sujets/TP1_Design_Patterns.pdf" → { label: "sujets/TP1 Design Patterns", type: "PDF" }
function describe(name: string) {
  const slash = name.lastIndexOf("/") + 1;
  const file = name.slice(slash);
  const dot = file.lastIndexOf(".");
  const base = dot > 0 ? file.slice(0, dot) : file;
  return { label: name.slice(0, slash) + base.replace(/[_-]+/g, " "), type: dot > 0 ? file.slice(dot + 1).toUpperCase() : "" };
}

/** The statement (énoncé) of a work: a button for a single file, a menu when there are several. */
export function StatementMenu({ files }: { files: StatementFile[] }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  // Close on a click outside, on Escape, or when the focus goes into the doc's iframe.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", close);
    };
  }, [open]);

  if (files.length === 0) return null;
  if (files.length === 1) {
    return (
      <a href={files[0].url} target="_blank" rel="noopener" title={files[0].name} className="btn">
        <FileIcon /> Énoncé
      </a>
    );
  }

  return (
    <div ref={menu} className="relative">
      <button type="button" className="btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <FileIcon /> Énoncé <span className="text-xs text-zinc-400">{files.length}</span>
        <ChevronDownIcon className="size-3.5" />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 max-h-80 w-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {files.map((file) => {
            const { label, type } = describe(file.name);
            return (
              <li key={file.url} role="none">
                <a
                  role="menuitem"
                  href={file.url}
                  target="_blank"
                  rel="noopener"
                  title={file.name}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <FileIcon className="size-4 shrink-0 text-zinc-400" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {type && (
                    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                      {type}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
