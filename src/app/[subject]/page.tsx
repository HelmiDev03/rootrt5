import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeIcon, DocIcon } from "@/components/icons";
import { SummaryFile } from "@/components/summary-file";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSubject, getSubjects, subjectStats } from "@/lib/content";
import { formatSize, servedFileUrl } from "@/lib/file-label";

export function generateStaticParams() {
  return getSubjects().map((subject) => ({ subject: subject.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[subject]">): Promise<Metadata> {
  return { title: getSubject((await params).subject)?.title };
}

export default async function SubjectPage({ params }: PageProps<"/[subject]">) {
  const subject = getSubject((await params).subject);
  if (!subject) notFound();
  const { summary } = subject;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
      <nav className="flex items-center justify-between text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Toutes les matières
        </Link>
        <ThemeToggle />
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{subject.title}</h1>
      <p className="mt-2 text-zinc-500">{subjectStats(subject)}</p>

      <ul className="mt-10 grid gap-4">
        {subject.works.map((work) => {
          const room = `/${subject.slug}/${work.slug}`;
          return (
            <li
              key={work.slug}
              className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link href={room} className="group flex min-w-0 flex-1 items-start gap-4">
                <span className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 font-mono text-sm font-semibold text-white">
                  {work.folder}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {work.title ?? work.folder}
                  </span>
                  {work.description && (
                    <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">{work.description}</span>
                  )}
                  {work.authors && <span className="mt-2 block text-xs text-zinc-500">{work.authors}</span>}
                </span>
              </Link>
              <div className="flex shrink-0 gap-2">
                {work.hasDoc && (
                  <Link href={`${room}#doc`} className="btn-primary">
                    <DocIcon /> Documentation
                  </Link>
                )}
                <Link href={`${room}#code`} className="btn">
                  <CodeIcon /> Code
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {summary && summary.files.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Résumés</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.files.map((file) => (
              <SummaryFile
                key={file.path}
                name={file.path}
                url={servedFileUrl(`/${subject.slug}/${summary.slug}`, file.path)}
                size={formatSize(file.size)}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
