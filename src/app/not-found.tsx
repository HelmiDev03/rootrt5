import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-5 py-24 text-center">
      <div>
        <p className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          ← Retour aux matières
        </Link>
      </div>
    </main>
  );
}
