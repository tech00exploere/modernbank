"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [phone, setPhone] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, governmentId, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Registration failed");
      }

      setSuccess("Submitted. Your account is pending admin verification.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      <div className="section grid min-h-screen place-items-center py-16">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">
            Account creation
          </p>
          <h1 className="mt-3 font-display text-3xl">Start onboarding</h1>
          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-sm text-slate">
              Full name
              <input
                type="text"
                placeholder="Rhea Kapoor"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
                required
              />
            </label>
            <label className="text-sm text-slate">
              Email
              <input
                type="email"
                placeholder="you@bank.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
                required
              />
            </label>
            <label className="text-sm text-slate">
              Phone
              <input
                type="tel"
                placeholder="+1 555 000 4422"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm text-slate">
              Government ID
              <input
                type="text"
                placeholder="SSN / PAN"
                value={governmentId}
                onChange={(event) => setGovernmentId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm text-slate md:col-span-2">
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
                required
              />
            </label>
            <label className="text-sm text-slate md:col-span-2">
              Upload documents
              <input
                type="file"
                className="mt-2 w-full rounded-xl border border-dashed border-ink/20 bg-sand/40 px-4 py-6 text-sm"
              />
            </label>
            {error ? (
              <div className="md:col-span-2 rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="md:col-span-2 rounded-2xl bg-moss/10 px-4 py-3 text-sm text-moss">
                {success}
              </div>
            ) : null}
            <button
              className="md:col-span-2 rounded-full bg-ink px-4 py-3 text-sm text-sand"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit for verification"}
            </button>
            <a
              href={`${apiUrl}/auth/google/start`}
              className="md:col-span-2 block w-full rounded-full border border-ink/20 bg-white px-4 py-3 text-center text-sm text-ink"
            >
              Continue with Google
            </a>
          </form>
          <p className="mt-5 text-sm text-slate">
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
          <div className="mt-6 rounded-2xl bg-sand/60 p-4 text-sm text-slate">
            Status after submission: <span className="text-ember">PENDING</span>. An
            admin verifies KYC before account activation.
          </div>
        </div>
      </div>
    </div>
  );
}
