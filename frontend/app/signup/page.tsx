"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { registerUser, googleSignIn } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";
import { Shield, ArrowRight, Lock, Mail, User, AlertCircle, RefreshCw } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(name.trim(), email.trim(), password);
      if (res.success && res.user) {
        setStoredUser(res.user);
        window.location.href = "/onboarding";
      } else {
        setError(res.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Could not complete registration");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google OAuth is enabled on backend. To activate browser popup, set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your frontend environment.");
      return;
    }

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response.credential) {
            setLoading(true);
            try {
              const res = await googleSignIn(response.credential);
              if (res.success && res.user) {
                window.location.href = res.is_new_user ? "/onboarding" : "/";
              } else {
                setError(res.error || "Google sign-up failed.");
              }
            } catch (err: any) {
              setError(err.message || "Could not complete Google sign-up.");
            } finally {
              setLoading(false);
            }
          }
        },
      });
      (window as any).google.accounts.id.prompt();
    } else {
      setError("Google Identity SDK is loading. Please check internet connection or retry in a moment.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-accent/15 text-accent rounded-2xl flex items-center justify-center mx-auto border border-accent/25">
          <Shield className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary font-display">Create Your ProsperHigh Account</h1>
        <p className="text-xs text-secondary-muted">Understand your investments with personalized multi-agent AI intelligence.</p>
      </div>

      <div className="prosper-card p-6 sm:p-7 space-y-4">
        {error && (
          <div className="p-3 bg-negative/10 text-negative border border-negative/20 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Full Name</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 text-secondary-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-surface-elevated border border-border-subtle rounded-2xl pl-10 pr-4 py-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-secondary-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-surface-elevated border border-border-subtle rounded-2xl pl-10 pr-4 py-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-secondary-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-elevated border border-border-subtle rounded-2xl pl-10 pr-4 py-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-secondary-muted uppercase tracking-wider">Confirm Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-secondary-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-elevated border border-border-subtle rounded-2xl pl-10 pr-4 py-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-full transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <span>CREATE ACCOUNT</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink mx-3 text-[11px] text-secondary-muted font-bold uppercase tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-surface border border-border-subtle hover:bg-surface-elevated text-primary font-bold text-xs rounded-full transition-all shadow-sm flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign Up with Google</span>
        </button>

        <div className="pt-4 border-t border-border-subtle text-center text-xs text-secondary-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
