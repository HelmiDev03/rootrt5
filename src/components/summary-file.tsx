"use client";

import type { MouseEvent } from "react";
import { describeFile } from "@/lib/file-label";
import { DownloadIcon, FileIcon } from "./icons";

// Browsers can't show Word, PowerPoint or Excel files: they open in Microsoft's online viewer,
// which reads them from the site's public URL (so on localhost they are just downloaded).
const OFFICE_FILE = /\.(docx?|pptx?|xlsx?)$/i;

function openInOfficeViewer(event: MouseEvent<HTMLAnchorElement>) {
  if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
  event.preventDefault();
  const src = encodeURIComponent(event.currentTarget.href);
  window.open(`https://view.officeapps.live.com/op/view.aspx?src=${src}`, "_blank", "noopener");
}

/** A course summary: opens in a new tab (PDF, images, Office files…), with a download button. */
export function SummaryFile({ name, url, size }: { name: string; url: string; size: string }) {
  const { label, type } = describeFile(name);
  const fileName = name.slice(name.lastIndexOf("/") + 1);

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <a
        href={url}
        target="_blank"
        rel="noopener"
        title={`Ouvrir ${fileName}`}
        onClick={OFFICE_FILE.test(name) ? openInOfficeViewer : undefined}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <FileIcon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            {label}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">{[type, size].filter(Boolean).join(" · ")}</span>
        </span>
      </a>
      <a href={url} download={fileName} className="btn px-2" title={`Télécharger ${fileName}`} aria-label={`Télécharger ${fileName}`}>
        <DownloadIcon className="size-4" />
      </a>
    </li>
  );
}
