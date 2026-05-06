"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Invalid credentials");
      return;
    }
    router.push("/landing");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="username"
            required
            placeholder="jane.smith@dot.ca.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Password
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="h-12 w-full rounded-lg bg-[var(--color-govdoc-primary)] text-sm font-semibold tracking-wide text-white shadow-md shadow-[var(--color-govdoc-primary)]/15 transition-all hover:bg-[var(--color-govdoc-deep)] hover:shadow-lg hover:shadow-[var(--color-govdoc-primary)]/25"
      >
        {busy ? (
          "Signing in…"
        ) : (
          <>
            Sign in with SSO
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>

      <p className="pt-1 text-center text-[11px] text-muted-foreground">
        Secured with State Single Sign-On + Multi-Factor Authentication
      </p>
    </form>
  );
}
