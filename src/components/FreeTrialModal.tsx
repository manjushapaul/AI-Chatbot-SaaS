"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";

export function FreeTrialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, company }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Something went wrong");
      }

      const data = await res.json();

      // Automatically sign in the user after successful signup
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase(),
        password: password,
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto-signin fails, redirect to signin page
        router.push(`/auth/signin?email=${encodeURIComponent(email)}`);
      } else {
        // Successfully signed in, redirect to dashboard
        router.push("/dashboard");
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-slate-900">
          Start your free trial
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          No credit card required. Get instant access to your AI chatbot dashboard.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="Work email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            required
            placeholder="Create a password"
            minLength={8}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Company (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={loading}
          />

          {error && (
            <p className="text-xs text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating your trial..." : "Start free 14‑day trial"}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-700 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}




