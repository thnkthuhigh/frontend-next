"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// P2-006: Real-time email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // P2-006: Real-time validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Monochrome Background Effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-zinc-500/5 dark:bg-zinc-400/5 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-2xl glass-card">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-white/60">Sign in to continue to AI Document Formatter</p>
        </div>

        {/* Login Card */}
        <div className="magic-border p-[2px] rounded-2xl">
          <div className="bg-card dark:bg-gradient-to-b dark:from-[#1a1c24] dark:to-[#12141a] rounded-2xl p-8 border border-border">
            {/* Google Login */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 font-medium rounded-xl flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card dark:bg-[#16181f] text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email Login Form - P2-006: Real-time validation */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 flex items-center justify-between">
                  <span>Email</span>
                  {emailTouched && email && (
                    <span className={cn(
                      "text-xs flex items-center gap-1 transition-colors",
                      emailValid ? "text-green-400" : "text-red-400"
                    )}>
                      {emailValid ? (
                        <><CheckCircle2 size={12} /> Valid</>
                      ) : (
                        <><XCircle size={12} /> Invalid email</>
                      )}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Mail className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    emailTouched && email
                      ? emailValid ? "text-green-400" : "text-red-400"
                      : "text-white/30"
                  )} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="you@example.com"
                    required
                    className={cn(
                      "h-12 pl-10 bg-white/5 rounded-xl text-white placeholder:text-white/30 transition-colors",
                      emailTouched && email
                        ? emailValid
                          ? "border-green-500/50 hover:border-green-500/70 focus:border-green-500"
                          : "border-red-500/50 hover:border-red-500/70 focus:border-red-500"
                        : "border-white/10 hover:border-white/20 focus:border-blue-500/50"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 flex items-center justify-between">
                  <span>Password</span>
                  {passwordTouched && password && (
                    <span className={cn(
                      "text-xs flex items-center gap-1 transition-colors",
                      passwordValid ? "text-green-400" : "text-amber-400"
                    )}>
                      {passwordValid ? (
                        <><CheckCircle2 size={12} /> Strong</>
                      ) : (
                        <><XCircle size={12} /> Min 6 chars</>
                      )}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    passwordTouched && password
                      ? passwordValid ? "text-green-400" : "text-amber-400"
                      : "text-white/30"
                  )} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    required
                    className={cn(
                      "h-12 pl-10 pr-10 bg-white/5 rounded-xl text-white placeholder:text-white/30 transition-colors",
                      passwordTouched && password
                        ? passwordValid
                          ? "border-green-500/50 hover:border-green-500/70 focus:border-green-500"
                          : "border-amber-500/50 hover:border-amber-500/70 focus:border-amber-500"
                        : "border-white/10 hover:border-white/20 focus:border-blue-500/50"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.35)'
                }}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-white/40">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <p className="text-center">
          <Link href="/" className="text-sm text-white/40 hover:text-white/60">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
