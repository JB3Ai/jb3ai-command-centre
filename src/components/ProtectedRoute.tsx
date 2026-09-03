import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

/**
 * Wraps any subtree that requires an authenticated session.
 * - While auth state is resolving → spinner (avoids /login flash on refresh).
 * - No session → redirect to /login, preserving the attempted path so
 *   we can bounce them back after sign-in (future enhancement).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-matte">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
