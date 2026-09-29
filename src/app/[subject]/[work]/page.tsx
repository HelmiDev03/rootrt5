import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Room } from "@/components/room";
import { DOC_FILE, getSubjects, getWork } from "@/lib/content";
import { EDITING_ENABLED } from "@/lib/edit-auth";

export function generateStaticParams() {
  return getSubjects().flatMap((subject) =>
    subject.works.map((work) => ({ subject: subject.slug, work: work.slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[subject]/[work]">): Promise<Metadata> {
  const { subject, work } = await params;
  const found = getWork(subject, work);
  return { title: found && `${found.work.folder} · ${found.subject.title}` };
}

export default async function WorkPage({ params }: PageProps<"/[subject]/[work]">) {
  const { subject: subjectSlug, work: workSlug } = await params;
  const found = getWork(subjectSlug, workSlug);
  if (!found) notFound();

  const { subject, work } = found;
  const base = `/${subject.slug}/${work.slug}`;

  return (
    <Room
      subject={{ title: subject.title, href: `/${subject.slug}` }}
      work={{
        folder: work.folder,
        title: work.title,
        docUrl: work.hasDoc ? `${base}/${DOC_FILE}` : null,
        codeUrl: work.codeUrl,
        githubUrl: work.githubUrl,
        statement: work.statement.map((file) => ({
          name: file.split("/").slice(1).join("/"), // path inside the enonce folder
          url: `${base}/${file.split("/").map(encodeURIComponent).join("/")}`,
        })),
      }}
      // Editing saves files on disk: only offered in `next dev` with EDIT_PASSWORD set (see edit-auth.ts).
      edit={EDITING_ENABLED && work.hasDoc ? { subject: subject.slug, work: work.slug } : null}
    />
  );
}
