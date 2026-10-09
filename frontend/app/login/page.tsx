"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { loginUser, googleSignIn } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";
import { Shield, ArrowRight, Lock, Mail, AlertCircle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.success && res.user) {
        setStoredUser(res.user);
        window.location.href = "/";
      } else {
        setError(res.error || "Invalid login credentials");
      }
    } catch (err: any) {
      setError(err.message || "Could not complete login");
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
                setError(res.error || "Google sign-in failed.");
              }
            } catch (err: any) {
              setError(err.message || "Could not complete Google sign-in.");
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
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
          <Shield className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-charcoal font-manrope">Welcome Back to ProsperHigh</h1>
        <p className="text-xs text-slate-500">Sign in to access your personalized portfolio intelligence.</p>
      </div>

      <div className="prosper-card p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-negative border border-red-200 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase">Password</label>
              <a href="#" className="text-[11px] text-primary hover:underline font-semibold">Forgot Password?</a>
            </div>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>SIGN IN</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold uppercase">or continue with</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-charcoal font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
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
          <span>Sign In with Google</span>
        </button>

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Create Account Free
          </Link>
        </div>
      </div>
    </div>
  );
}
