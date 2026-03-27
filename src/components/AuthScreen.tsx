import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowRight, Loader2, Scale } from "lucide-react";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000") as string;

interface AuthScreenProps {
  onLogin: (user: { id: string | number; email: string }) => void;
  onGuest: () => void;
}

// localStorage helpers for user storage
function getUsers(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("nr_users") || "{}"); } catch { return {}; }
}
function saveUsers(users: Record<string, string>) {
  localStorage.setItem("nr_users", JSON.stringify(users));
}

export default function AuthScreen({ onLogin, onGuest }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/login" : "/api/signup";
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        setError(data.detail || data.error || data.message || "Authentication failed.");
        return;
      }

      const user = {
        id: data.id ?? data.user?.id ?? trimmedEmail,
        email: data.email ?? trimmedEmail,
      };

      localStorage.setItem("nr_user", JSON.stringify(user));
      localStorage.removeItem("nr_guest");
      setSuccess(isLogin ? "Signed in successfully!" : "Account created successfully!");
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-indigo-500/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Scale className="text-white" size={32} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">NyayRakshak AI</h1>
            <p className="text-slate-400 text-sm">Your AI-Powered Legal Guardian</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* Tabs */}
                <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                  <button onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isLogin ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:text-white"}`}>
                    <LogIn size={16} /> Sign In
                  </button>
                  <button onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${!isLogin ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:text-white"}`}>
                    <UserPlus size={16} /> Sign Up
                  </button>
                </div>

                {/* Messages */}
                <AnimatePresence mode="wait">
                  {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</motion.div>}
                  {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-4">{success}</motion.div>}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" autoComplete="email" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      autoComplete={isLogin ? "current-password" : "new-password"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" autoComplete="new-password" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isLogin ? "Sign In" : "Sign Up"} <ArrowRight size={18} /></>}
                  </motion.button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" /><span className="text-slate-500 text-xs uppercase tracking-wider">or</span><div className="flex-1 h-px bg-white/10" />
                </div>
                <motion.button onClick={onGuest} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                  <Shield size={18} /> Continue as Guest
                </motion.button>
              </motion.div>
          </AnimatePresence>

          <p className="text-center text-slate-500 text-xs mt-6">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </motion.div>
    </div>
  );
}
