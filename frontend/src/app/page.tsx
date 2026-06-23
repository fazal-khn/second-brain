"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FileText, Mail, Lock, User, ArrowRight, ShieldCheck, Cpu, Sparkles } from "lucide-react";
import { authAPI } from "@/lib/api";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    authAPI.me()
      .then(() => {
        router.push("/dashboard");
      })
      .catch(() => {
        // Not logged in, stay on this page
      });
  }, [router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setAuthError(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isLogin) {
        await authAPI.login({
          email: data.email,
          password: data.password,
        });
      } else {
        await authAPI.register({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
        });
        // Auto-login after successful registration
        await authAPI.login({
          email: data.email,
          password: data.password,
        });
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Auth error:", err);
      const detail = err.response?.data?.detail || "Authentication failed. Please try again.";
      setAuthError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Send the user info to our backend to generate our own JWT and sync user record
      await authAPI.googleLogin({
        email: user.email!,
        full_name: user.displayName || "Google User",
        uid: user.uid
      });
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completion.");
      } else {
        setAuthError("Google authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-violet/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-primary-blue/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Product Intro */}
        <div className="lg:col-span-6 flex flex-col space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <div className="p-3 bg-gradient-to-tr from-primary-violet to-primary-blue rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Doc<span className="text-gradient">Analyzer</span>
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            The Ultimate AI-Powered <br className="hidden md:inline" />
            <span className="text-gradient">Document Intelligence</span>
          </h1>

          <p className="text-neutral-400 text-base md:text-lg max-w-lg leading-relaxed mx-auto lg:mx-0">
            Upload PDFs, DOCX, or text files to instantly summarize them, chat with excerpts, extract semantic keys, and run multi-document comparative side-by-side matrices.
          </p>

          {/* Features badge */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-4">
            <div className="flex items-center space-x-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <Cpu className="h-5 w-5 text-primary-blue shrink-0" />
              <span className="text-xs font-semibold text-neutral-300">RAG Chat & Q&A</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <ShieldCheck className="h-5 w-5 text-primary-violet shrink-0" />
              <span className="text-xs font-semibold text-neutral-300">Isolated Storage</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <Sparkles className="h-5 w-5 text-yellow-500 shrink-0" />
              <span className="text-xs font-semibold text-neutral-300">Smart Actions</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <Sparkles className="h-5 w-5 text-primary-violet shrink-0" />
              <span className="text-xs font-semibold text-neutral-300">Document Compare</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Box */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl border border-neutral-800">
            
            {/* Header Tabs */}
            <div className="flex bg-neutral-950 p-1.5 rounded-lg mb-8 border border-neutral-800">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-md transition-all ${
                  isLogin
                    ? "bg-neutral-800 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-md transition-all ${
                  !isLogin
                    ? "bg-neutral-800 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg animate-fade-in">
                {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Full Name field (Register only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 focus:border-primary-violet rounded-lg outline-none text-sm text-white transition-all"
                      {...register("full_name", { required: "Name is required for registration" })}
                    />
                  </div>
                  {errors.full_name && (
                    <span className="text-xs text-red-500">{errors.full_name.message as string}</span>
                  )}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 focus:border-primary-violet rounded-lg outline-none text-sm text-white transition-all"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email.message as string}</span>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 focus:border-primary-violet rounded-lg outline-none text-sm text-white transition-all"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    })}
                  />
                </div>
                {errors.password && (
                  <span className="text-xs text-red-500">{errors.password.message as string}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-primary-violet to-primary-blue hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg transition-all pt-2.5 pb-2.5"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span>{isLogin ? "Sign In" : "Register Now"}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center space-x-4 my-6">
                <div className="flex-1 h-px bg-neutral-800"></div>
                <span className="text-xs text-neutral-500 font-medium">OR CONTINUE WITH</span>
                <div className="flex-1 h-px bg-neutral-800"></div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow transition-all"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
