import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PasswordStrength } from "@/components/PasswordStrength";
import { checkPassword, pwValid } from "@/lib/password";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — SmartApply" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => { if (profile) { setName(profile.full_name); setEmail(profile.email); } }, [profile]);

  async function saveProfile() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      if (email !== profile?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        toast.message("Check your inbox to confirm the new email.");
      }
      const { error } = await supabase.from("profiles").update({ full_name: name, email }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function changePassword() {
    if (!pwValid(checkPassword(pw)) || pw !== confirm) { toast.error("Password requirements not met"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    setPw(""); setConfirm("");
    toast.success("Password changed");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="text-xs text-muted-foreground">
            Account created: {profile?.created_at ? format(new Date(profile.created_at), "PPP") : "—"}<br />
            Last login: {profile?.last_login ? format(new Date(profile.last_login), "PPP p") : "—"}
          </div>
          <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change password</CardTitle><CardDescription>Requires a strong new password.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /><PasswordStrength password={pw} /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={changingPw || !pwValid(checkPassword(pw)) || pw !== confirm}>{changingPw && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Change password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
