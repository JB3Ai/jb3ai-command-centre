import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * /auth/callback — landing page for the magic link.
 *
 * Supabase's `detectSessionInUrl: true` automatically reads the access_token
 * from the URL hash and persists it. We just need a route to land on while
 * onAuthStateChange fires; once it does, we navigate to /home.
 *
 * If the user lands here without a pending session AND already has none,
 * we bounce to /login.
 */
export default function AuthCallbackPage() {
  const { session, loading } = useAuth();

  useEffect(() => {
    // Just-in-case cleanup of any leftover tokens in the URL after Supabase
    // has consumed them, so /home doesn't render with #access_token=… visible.
    if (!loading && session && window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, [loading, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-matte text-ink">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        <span className="text-[12px] text-ink-mute">Signing you in…</span>
      </div>
    );
  }

  return <Navigate to={session ? "/home" : "/login"} replace />;
}
