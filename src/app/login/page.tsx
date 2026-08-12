"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "login" | "register" | "recover";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 shadow-lg">
        <h1 className="font-display text-3xl font-bold text-center mb-1">EvoBuddy</h1>
        <p className="text-center text-sm opacity-70 mb-6">Your own original digital companion.</p>

        <div role="tablist" aria-label="Account actions" className="flex gap-1 mb-6 rounded-full bg-black/5 p-1 text-sm">
          {(["login", "register", "recover"] as Tab[]).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-full py-2 font-semibold transition ${
                tab === id ? "bg-[var(--color-brand)] text-white shadow" : "opacity-70"
              }`}
            >
              {id === "login" ? "Sign in" : id === "register" ? "New player" : "Forgot PIN"}
            </button>
          ))}
        </div>

        {tab === "login" && <LoginForm onSuccess={() => router.push("/")} />}
        {tab === "register" && <RegisterForm onSuccess={() => router.push("/")} />}
        {tab === "recover" && <RecoverForm onSuccess={() => setTab("login")} />}

        <p className="mt-6 text-center text-[11px] tracking-wide opacity-40">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
        </p>
      </div>
    </main>
  );
}

function Field({
  label, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-semibold mb-3">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-3 py-2 text-base font-normal outline-none focus:border-[var(--color-brand)]"
      />
    </label>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Field label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required autoComplete="username" />
      <Field label="PIN" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required autoComplete="current-password" />
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-brand)] py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, pin, parentEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.recoveryCode) {
        setRecoveryCode(data.recoveryCode);
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  if (recoveryCode) {
    return (
      <div>
        <p className="text-sm mb-2 font-semibold">Save this PIN recovery code somewhere safe (parents only):</p>
        <p className="mb-4 rounded-xl bg-black/5 p-3 text-center font-mono text-lg tracking-wider">{recoveryCode}</p>
        <p className="text-xs opacity-70 mb-4">This code is shown only once and can be used to reset a forgotten PIN.</p>
        <button onClick={onSuccess} className="w-full rounded-xl bg-[var(--color-brand)] py-3 font-bold text-white">
          Continue
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="text-xs opacity-70 mb-3">A parent should set this up. Pick a nickname and a 4-6 digit PIN.</p>
      <Field label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required autoComplete="username" />
      <Field label="PIN (4-6 digits)" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required autoComplete="new-password" />
      <Field label="Parent email (optional)" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} autoComplete="email" />
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-brand)] py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function RecoverForm({ onSuccess }: { onSuccess: () => void }) {
  const [nickname, setNickname] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, recoveryCode, newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
      setTimeout(onSuccess, 1200);
    } finally {
      setLoading(false);
    }
  }

  if (success) return <p className="text-sm font-semibold">PIN reset. Redirecting to sign in…</p>;

  return (
    <form onSubmit={submit}>
      <Field label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
      <Field label="Recovery code" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required />
      <Field label="New PIN" type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} required />
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[var(--color-brand)] py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? "Resetting…" : "Reset PIN"}
      </button>
    </form>
  );
}
