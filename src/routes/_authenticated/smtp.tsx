import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { testSmtp } from "@/lib/mailer.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/smtp")({
  head: () => ({ meta: [{ title: "SMTP Settings — SmartApply" }] }),
  component: SmtpPage,
});

function SmtpPage() {
  const qc = useQueryClient();
  const test = useServerFn(testSmtp);
  const { data: smtp } = useQuery({
    queryKey: ["smtp_settings"],
    queryFn: async () => (await supabase.from("smtp_settings").select("*").maybeSingle()).data,
  });

  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (smtp) {
      setSenderEmail(smtp.sender_email);
      setSenderName(smtp.sender_name ?? "");
      setHost(smtp.smtp_host);
      setPort(smtp.smtp_port);
      setPassword(smtp.smtp_password);
    }
  }, [smtp]);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("smtp_settings").upsert({
        user_id: user.id, sender_email: senderEmail, sender_name: senderName || null, smtp_host: host, smtp_port: port, smtp_password: password,
      });
      if (error) throw error;
      toast.success("SMTP settings saved");
      qc.invalidateQueries({ queryKey: ["smtp_settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function onTest() {
    setTesting(true);
    try {
      const r = await test();
      if (r.ok) toast.success("✓ Connection successful");
      else toast.error("✗ " + (r.error ?? "Connection failed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally { setTesting(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMTP Settings</h1>
        <p className="text-muted-foreground mt-1">Send emails from your own inbox. Gmail App Password recommended.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your SMTP credentials</CardTitle>
          <CardDescription>For Gmail, create an <a className="text-primary underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">App Password</a> (requires 2FA).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Sender email *</Label><Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="you@gmail.com" /></div>
            <div><Label>Sender name</Label><Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your full name" /></div>
            <div><Label>SMTP host *</Label><Input value={host} onChange={(e) => setHost(e.target.value)} /></div>
            <div><Label>SMTP port *</Label><Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} /></div>
          </div>
          <div><Label>App password *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••••••" /></div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !senderEmail || !password}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save</Button>
            <Button variant="outline" onClick={onTest} disabled={testing || !smtp}>{testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Test connection</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
