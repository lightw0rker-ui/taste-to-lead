import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Lock, UserPlus, Mail, ShieldCheck } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/agent");
    },
    onError: (err: Error) => {
      toast({
        title: "Login failed",
        description: err.message.includes("401") ? "Invalid email or password" : err.message,
        variant: "destructive",
      });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/send-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({ title: "Code Sent", description: `A 6-digit verification code has been sent to ${email}.` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send code", description: err.message, variant: "destructive" });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/verify-code", { email, code: verificationCode });
      return res.json();
    },
    onSuccess: () => {
      setEmailVerified(true);
      toast({ title: "Email Verified", description: "Your email has been verified. You can now complete signup." });
    },
    onError: (err: Error) => {
      toast({ title: "Verification failed", description: err.message.includes("400") ? "Invalid or expired code" : err.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/signup", {
        email,
        password,
        name,
        inviteCode: inviteCode.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account created",
        description: `Welcome, ${data.name}! You've been assigned to ${data.organizationName || "Public / Freelance"}.`,
      });
      setLocation("/agent");
    },
    onError: (err: Error) => {
      toast({
        title: "Signup failed",
        description: err.message.includes("409") ? "An account with this email already exists" : err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate();
    } else {
      signupMutation.mutate();
    }
  };

  const isPending = loginMutation.isPending || signupMutation.isPending || sendCodeMutation.isPending || verifyCodeMutation.isPending;

  const handleModeSwitch = (newMode: "login" | "signup") => {
    setMode(newMode);
    setCodeSent(false);
    setEmailVerified(false);
    setVerificationCode("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter italic text-foreground" data-testid="text-login-title">
            Taste
          </h1>
          <p className="text-muted-foreground text-sm">Agent Console</p>
        </div>

        <Card className="p-6 backdrop-blur-xl bg-card/80 border-card-border space-y-5">
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              data-testid="button-tab-login"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("signup")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              data-testid="button-tab-signup"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-signup-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCodeSent(false);
                      setEmailVerified(false);
                      setVerificationCode("");
                    }}
                    required
                    disabled={emailVerified}
                    data-testid="input-login-email"
                  />
                  {!emailVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={!email || sendCodeMutation.isPending}
                      onClick={() => sendCodeMutation.mutate()}
                      data-testid="button-send-code"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {sendCodeMutation.isPending ? "Sending..." : codeSent ? "Resend" : "Verify"}
                    </Button>
                  )}
                  {emailVerified && (
                    <div className="flex items-center gap-1 text-emerald-500 shrink-0 px-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {codeSent && !emailVerified && (
                <div className="space-y-1.5">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      data-testid="input-verification-code"
                    />
                    <Button
                      type="button"
                      className="shrink-0"
                      disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                      onClick={() => verifyCodeMutation.mutate()}
                      data-testid="button-verify-code"
                    >
                      {verifyCodeMutation.isPending ? "Verifying..." : "Confirm"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Check your email for the 6-digit code</p>
                </div>
              )}

              {emailVerified && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-login-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inviteCode">Invite Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="e.g. TASTE-PRO-2025"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      data-testid="input-signup-invite-code"
                    />
                    <p className="text-xs text-muted-foreground">
                      Have a code from your agency? Enter it to join their team.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signupMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {signupMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Consumer? <a href="/" className="text-primary hover:underline" data-testid="link-consumer-home">Browse properties</a>
        </p>
      </div>
    </div>
  );
}
