"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type PasswordDialogProps = {
  onUnlocked: () => void;
  onCancel: () => void;
};

/** Asks for the edit password; the server checks it and remembers this browser for a while. */
export function PasswordDialog({ onUnlocked, onCancel }: PasswordDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError("");
    const res = await fetch("/api/edit-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: new FormData(event.currentTarget).get("password") }),
    }).catch(() => null);
    setChecking(false);
    if (res?.ok) onUnlocked();
    else setError(res?.status === 401 ? "Mot de passe incorrect." : "Erreur, réessayez.");
  }

  return (
    <dialog
      ref={dialog}
      onClose={onCancel}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <form onSubmit={submit}>
        <h2 className="text-base font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-zinc-500">Saisissez le mot de passe pour modifier la documentation.</p>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-label="Mot de passe"
          className="mt-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="btn-primary disabled:opacity-50" disabled={checking}>
            {checking ? "Vérification…" : "Déverrouiller"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
