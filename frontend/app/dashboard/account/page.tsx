"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { getMe, updateMe, AccountUser } from "../../../lib/api";
import { formatINR } from "../../../lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMe();
        setUser(me);
        setName(me.name || "");
        setPhone(me.phone || "");
        setGovernmentId(me.governmentId || "");
      } catch {
        router.push("/login");
      }
    };

    load();
  }, [router]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || saving) {
      return;
    }

    setSaving(true);
    setStatusMessage("");

    try {
      const updated = await updateMe({
        name,
        phone,
        governmentId,
      });
      setUser(updated);
      setName(updated.name || "");
      setPhone(updated.phone || "");
      setGovernmentId(updated.governmentId || "");
      setStatusMessage("Profile updated successfully.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <p className="text-sm text-slate">Loading account details...</p>;
  }

  return (
    <ProtectedRoute
      title="Account profile"
      description="Verify identity, maintain KYC documents, and track account status."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Owner</p>
          <p className="mt-2">{user.name}</p>
          <p className="text-slate">{user.email}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Account</p>
          <p className="mt-2">{user.accountNo}</p>
          <p className="text-slate">Role: {user.role}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Balance</p>
          <p className="mt-2">{formatINR(user.balance)}</p>
          <p className="text-slate">Status: {user.status}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">KYC</p>
          <p className="mt-2">Phone: {user.phone || "Not provided"}</p>
          <p className="text-slate">Gov ID: {user.governmentId || "Not provided"}</p>
        </div>
      </div>
      <form
        onSubmit={handleUpdate}
        className="mt-6 grid gap-4 rounded-2xl border border-ink/10 bg-white p-5 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs uppercase tracking-[0.3em] text-slate">
          Update profile
        </p>
        <label className="text-sm text-slate">
          Full name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
          />
        </label>
        <label className="text-sm text-slate md:col-span-2">
          Government ID
          <input
            type="text"
            value={governmentId}
            onChange={(event) => setGovernmentId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ink px-5 py-2 text-sm text-sand"
          >
            {saving ? "Updating..." : "Update details"}
          </button>
          {statusMessage ? (
            <p className="text-sm text-slate">{statusMessage}</p>
          ) : null}
        </div>
      </form>
    </ProtectedRoute>
  );
}
