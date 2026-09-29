import Link from "next/link";
import { ChevronIcon, FolderIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { countWorks, getSubjects } from "@/lib/content";

export default function HomePage() {
  const subjects = getSubjects();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">RT5</p>
          <ThemeToggle />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Travaux pratiques</h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Choisissez une matière, puis un TP : lisez sa documentation ou parcourez son code dans VS Code.
        </p>
      </header>

      {subjects.length === 0 && <p className="text-zinc-500">Aucune matière pour l’instant.</p>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <li key={subject.slug}>
            <Link
              href={`/${subject.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <FolderIcon className="size-5" />
                </span>
                <ChevronIcon className="size-5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </div>
              <h2 className="mt-5 text-lg font-semibold leading-snug">{subject.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{countWorks(subject.works.length)}</p>
              {subject.works.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {subject.works.map((work) => (
                    <span
                      key={work.slug}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {work.folder}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
