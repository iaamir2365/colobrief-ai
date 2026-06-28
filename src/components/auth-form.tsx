"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Mail,
  Lock,
  User,
  Stethoscope,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Activity,
  MailCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  DatabaseZap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { fetchJson } from "@/lib/fetch-json";

type AuthMode = "login" | "signup" | "verify-email";

interface AuthFormProps {
  requireVerification?: boolean;
}

export default function AuthForm({ requireVerification = false }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(requireVerification ? "verify-email" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [doctorName, setDoctorName] = useState("");

  // Verification fields
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const userEmail = useAuthStore((s) => s.user?.email);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError("");
    try {
      const { data, response } = await fetchJson<{
        token: string;
        user: { id: string; name: string; email: string; emailVerified?: boolean };
        error?: string;
      }>(
        "/api/auth/demo-login",
        { method: "POST" }
      );
      if (!response.ok) throw new Error(data.error || "Demo login failed");
      localStorage.setItem("colobrief-token", data.token);
      useAuthStore.setState({ token: data.token, user: data.user, isLoading: false, isInitialized: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password, doctorName || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginOrSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password, doctorName || undefined);
        setMode("verify-email");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus on verification code input
  useEffect(() => {
    if (mode === "verify-email") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [mode]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow uppercase hex chars
    const cleaned = value.replace(/[^a-fA-F0-9]/g, "").toUpperCase().slice(0, 1);
    const newCode = verificationCode.split("");
    newCode[index] = cleaned;
    setVerificationCode(newCode.join(""));

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    setVerificationError("");
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^a-fA-F0-9]/g, "").toUpperCase().slice(0, 6);
    if (pasted.length === 6) {
      setVerificationCode(pasted);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSendVerification = async () => {
    setIsSendingCode(true);
    setVerificationError("");
    try {
      const { data, response } = await fetchJson<{ error?: string; message?: string }>(
        "/api/auth/send-verification",
        {
          method: "POST",
          headers: { ...getAuthHeadersLocal(), "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error(data.error || "Failed to send code");
      setResendCooldown(60);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError("Please enter all 6 digits");
      return;
    }
    setIsVerifying(true);
    setVerificationError("");
    try {
      const { data, response } = await fetchJson<{ error?: string }>(
        "/api/auth/verify-email",
        {
          method: "POST",
          headers: { ...getAuthHeadersLocal(), "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode }),
        }
      );
      if (!response.ok) throw new Error(data.error || "Verification failed");
      setVerificationSuccess(true);
      await refreshUser();
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
  };

  const switchToSignup = () => {
    setMode("signup");
    setError("");
  };

  const switchMode = () => {
    if (mode === "login") switchToSignup();
    else switchToLogin();
  };

  function getAuthHeadersLocal() {
    const token = localStorage.getItem("colobrief-token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25 mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">ColoBrief AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Empathetic UC Symptom Tracking</p>
        </div>

        <AnimatePresence mode="wait">
          {/* ===== EMAIL VERIFICATION SCREEN ===== */}
          {mode === "verify-email" && !verificationSuccess && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20 card-premium">
                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-teal-100 dark:from-violet-950/50 dark:to-teal-950/50 flex items-center justify-center mb-3">
                    <KeyRound className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle className="text-xl">Verify Your Email</CardTitle>
                  <CardDescription className="text-sm">
                    We sent a 6-digit code to your email address.
                    <br />
                    <span className="font-medium text-foreground">{userEmail}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Error */}
                  <AnimatePresence>
                    {verificationError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {verificationError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 6-digit code input */}
                  <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={verificationCode[i] || ""}
                        onChange={(e) => handleCodeChange(e.target.value, i)}
                        onKeyDown={(e) => handleCodeKeyDown(e, i)}
                        className="w-11 h-13 text-center text-xl font-bold font-mono tracking-wider"
                        disabled={isVerifying}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Check your inbox and spam folder. The code expires in 10 minutes.
                  </p>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 h-11 font-medium"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {isVerifying ? "Verifying..." : "Verify Email"}
                  </Button>

                  {/* Resend */}
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      Didn&apos;t receive the code?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={isSendingCode || resendCooldown > 0}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      {isSendingCode ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Resend
                        </>
                      )}
                    </button>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (requireVerification) {
                          logout();
                          setMode("login");
                          setVerificationCode("");
                          setVerificationError("");
                        } else {
                          switchToLogin();
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {requireVerification ? "Use a different account" : "Back to Sign In"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ===== VERIFICATION SUCCESS SCREEN ===== */}
          {mode === "verify-email" && verificationSuccess && (
            <motion.div
              key="verify-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20 card-premium">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
                  >
                    <MailCheck className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Email Verified!</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your email has been successfully verified. You now have full access to ColoBrief AI.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 h-11 font-medium"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ===== LOGIN / SIGNUP FORM ===== */}
          {mode !== "verify-email" && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 40 : -40 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20 card-premium">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </CardTitle>
                  <CardDescription>
                    {mode === "login"
                      ? "Sign in to access your symptom tracker"
                      : "Start tracking your Ulcerative Colitis symptoms"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleLoginOrSignup} className="space-y-4">
                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Name field (signup only) */}
                    <AnimatePresence>
                      {mode === "signup" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <div className="relative mt-1.5">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="name"
                              placeholder="Jane Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-9"
                              required={mode === "signup"}
                              disabled={isLoading}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-10"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Doctor name (signup only) */}
                    <AnimatePresence>
                      {mode === "signup" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="doctor" className="text-sm font-medium">
                            Gastroenterologist Name <span className="text-muted-foreground font-normal">(optional)</span>
                          </Label>
                          <div className="relative mt-1.5">
                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="doctor"
                              placeholder="Dr. Jane Smith"
                              value={doctorName}
                              onChange={(e) => setDoctorName(e.target.value)}
                              className="pl-9"
                              disabled={isLoading}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 h-11 font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {isLoading
                        ? mode === "login" ? "Signing in..." : "Creating account..."
                        : mode === "login" ? "Sign In" : "Create Account"}
                    </Button>

                    {/* Demo Login Button */}
                    <div className="relative">
                      <Separator className="my-4" />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 font-medium border-dashed border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 dark:hover:border-teal-600 transition-all"
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                      >
                        {isDemoLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <DatabaseZap className="h-4 w-4 mr-2" />
                        )}
                        {isDemoLoading ? "Loading Demo..." : "Try Demo — Explore with Sample Data"}
                      </Button>
                      <Separator className="my-4" />
                    </div>

                    {/* Switch mode */}
                    <div className="relative">
                      <Separator className="my-4" />
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground">
                          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                        </span>{" "}
                        <button
                          type="button"
                          onClick={switchMode}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                          disabled={isLoading}
                        >
                          {mode === "login" ? "Sign up" : "Sign in"}
                        </button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>JWT Secured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span>HIPAA Friendly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MailCheck className="h-3.5 w-3.5" />
            <span>Email Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}