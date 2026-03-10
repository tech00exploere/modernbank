"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const oauthError = searchParams.get("error");
  const oauthStatus = searchParams.get("status");

  const oauthErrorMessage = (() => {
    if (!oauthError) {
      return "";
    }
    if (oauthError === "google_not_configured") {
      return "Google sign-in is not configured on server yet.";
    }
    if (oauthError === "google_oauth_state") {
      return "Google sign-in session expired or blocked. Retry from login page again.";
    }
    if (oauthError === "google_session_save_failed") {
      return "Unable to persist login session before Google redirect. Restart backend and try again.";
    }
    if (oauthError === "google_token_exchange") {
      return `Google token exchange failed (status ${oauthStatus || "unknown"}). Check client ID/secret and redirect URI.`;
    }
    if (oauthError === "google_missing_id_token") {
      return "Google did not return an ID token. Verify OAuth consent and scopes.";
    }
    if (oauthError === "google_token_verify") {
      return "Unable to verify Google token. Try again in a moment.";
    }
    if (oauthError === "google_profile_invalid") {
      return "Google profile verification failed. Client ID may not match the token audience.";
    }
    if (oauthError === "google_auth_failed") {
      return "Google authentication callback failed on server. Check backend logs for details.";
    }
    return "Google sign-in failed. Please try again.";
  })();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Login failed");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      <div className="section grid min-h-screen place-items-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Welcome</p>
          <h1 className="mt-3 font-display text-3xl">Sign in to Modern Bank</h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate">Email</label>
              <input
                type="email"
                placeholder="you@bank.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate">Password</label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
                required
              />
            </div>
            {error ? (
              <p className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
                {error}
              </p>
            ) : null}
            <button
              className="w-full rounded-full bg-ink px-4 py-3 text-sm text-sand"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <a
              href={`${apiUrl}/auth/google/start`}
              className="block w-full rounded-full border border-ink/20 bg-white px-4 py-3 text-center text-sm text-ink"
            >
              Continue with Google
            </a>
          </form>
          {oauthErrorMessage ? (
            <p className="mt-4 rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
              {oauthErrorMessage}
            </p>
          ) : null}
          <p className="mt-6 text-sm text-slate">
            No account?{" "}
            <Link href="/register" className="text-ink">
              Open one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
