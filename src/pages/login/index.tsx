import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAllowedEmails, useAuth } from "@/lib/auth-context";

type LoginState =
  | { kind: "idle" }
  | { kind: "signingIn" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * /login — single-purpose password login page.
 * Lives OUTSIDE the Layout so the sidebar/topbar/status bar don't render.
 *
 * Lockdown: client-side allowlist (VITE_AUTH_ALLOWED_EMAILS) +
 * Supabase password authentication with strong password requirements.
 * Server-side: Supabase dashboard → Auth → Providers → Email →
 * "Allow signups" OFF; invite jono@jonoblackburn.com once.
 */
export default function LoginPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>({ kind: "idle" });
  const allowed = getAllowedEmails();

  // Pre-fill if there's only one allowed email
  useEffect(() => {
    if (allowed.length === 1) {
      setEmail(allowed[0]);
    }
  }, [allowed]);

  if (loading) return <FullScreenSpinner />;
  if (session) return <Navigate to="/home" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setState({ kind: "error", message: "Enter an email address." });
      return;
    }
    if (!allowed.includes(trimmedEmail)) {
      setState({
        kind: "error",
        message: "This email isn't authorised for the OS³ Command Centre.",
      });
      return;
    }
    if (!password) {
      setState({ kind: "error", message: "Enter your password." });
      return;
    }

    setState({ kind: "signingIn" });
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password,
    });

    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    setState({ kind: "success" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-matte px-4">
      <div className="w-full max-w-sm rounded-lg border border-edge bg-graphite p-8 shadow-2xl">
        {/* Wordmark */}
        <div className="mb-7 text-center">
          <div className="font-display text-2xl font-bold tracking-[0.22em] text-ink">
            JB³Ai
          </div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
            OS³ Command Centre
          </div>
        </div>

        {state.kind === "success" ? (
          <div className="text-center">
            <CheckCircle2
              className="mx-auto mb-3 h-8 w-8 text-emerald-500"
              strokeWidth={1.5}
            />
            <h1 className="font-display text-lg font-semibold text-ink">
              Signing in…
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
              Redirecting to the dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-center font-display text-lg font-semibold text-ink">
              Sign in
            </h1>
            <p className="text-center text-[12px] text-ink-mute">
              Enter your authorised email and password.
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-ghost">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-md border border-edge bg-steel px-3 py-2 focus-within:border-cyan-30">
                <Mail className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={state.kind === "signingIn"}
                  className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-ghost disabled:opacity-60"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-ghost">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-md border border-edge bg-steel px-3 py-2 focus-within:border-cyan-30">
                <Lock className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={state.kind === "signingIn"}
                  className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-ghost disabled:opacity-60"
                />
              </div>
            </label>

            {state.kind === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{state.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={state.kind === "signingIn"}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan py-2.5 text-[13px] font-bold text-matte transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {state.kind === "signingIn" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        )}

        <div className="mt-7 text-center text-[10px] text-ink-ghost">
          Pretoria · Gauteng · South Africa
        </div>
      </div>
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-matte">
      <Loader2 className="h-6 w-6 animate-spin text-cyan" />
    </div>
  );
}
