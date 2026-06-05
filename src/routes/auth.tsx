import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { PasswordStrength } from "@/components/PasswordStrength";
import { checkPassword, pwValid } from "@/lib/password";

const searchSchema = z.object({ mode: z.enum(["login", "signup", "forgot", "reset"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — SmartApply" }] }),
  beforeLoad: async () => {
    // If already signed in on client, send to dashboard.
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(mode ?? "login");

  // Detect password recovery hash
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery")) setTab("reset");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-surface)" }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center text-primary-foreground font-bold mb-3" style={{ background: "var(--gradient-primary)" }}>S</div>
          <h1 className="text-2xl font-bold tracking-tight">SmartApply</h1>
          <p className="text-sm text-muted-foreground mt-1">AI job applications, on autopilot.</p>
        </div>

        <Card className="border-border" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <CardHeader>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create</TabsTrigger>
                <TabsTrigger value="forgot">Forgot</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6"><LoginForm onDone={() => navigate({ to: "/dashboard" })} /></TabsContent>
              <TabsContent value="signup" className="mt-6"><SignupForm onDone={() => setTab("login")} /></TabsContent>
              <TabsContent value="forgot" className="mt-6"><ForgotForm /></TabsContent>
              <TabsContent value="reset" className="mt-6"><ResetForm onDone={() => { setTab("login"); window.location.hash = ""; }} /></TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={async () => {
      setLoading(true);
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
      if (result.error) { toast.error(result.error.message); setLoading(false); return; }
      if (result.redirected) return;
      window.location.href = "/dashboard";
    }}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      )}
      Continue with Google
    </Button>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("Invalid email or password."); return; }
      // Update last_login
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id);
      toast.success("Welcome back!");
      onDone();
    }}>
      <GoogleButton />
      <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
      <div className="space-y-2"><Label>Password</Label><div className="relative"><Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /><button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
      <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Sign in</Button>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const valid = pwValid(checkPassword(password)) && password === confirm && fullName.length > 1 && email.includes("@");

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!valid) { toast.error("Please complete all fields correctly."); return; }
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Account created! You can now sign in.");
      onDone();
    }}>
      <GoogleButton />
      <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
      <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} /></div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} /></div>
      <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /><PasswordStrength password={password} /></div>
      <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />{confirm && confirm !== password && <p className="text-xs text-destructive">Passwords don't match</p>}</div>
      <Button type="submit" className="w-full" disabled={loading || !valid}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create account</Button>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=reset` });
      setLoading(false);
      if (error) console.error("[reset-password]", error.message);
      // Always show the same message to prevent user enumeration.
      toast.success("If that address is registered, a reset link has been sent.");
    }}>

      <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Send reset link</Button>
    </form>
  );
}

function ResetForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const valid = pwValid(checkPassword(password)) && password === confirm;
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!valid) return;
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Password reset successfully.");
      onDone();
    }}>
      <CardTitle className="text-base">Set a new password</CardTitle>
      <div className="space-y-2"><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /><PasswordStrength password={password} /></div>
      <div className="space-y-2"><Label>Confirm</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={loading || !valid}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Reset password</Button>
    </form>
  );
}
