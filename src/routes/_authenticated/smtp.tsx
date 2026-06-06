import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testSmtp, getSmtpSettings, saveSmtpSettings } from "@/lib/mailer.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/smtp")({
  head: () => ({ meta: [{ title: "SMTP Settings — SmartApply" }] }),
  component: SmtpPage,
});

function SmtpPage() {
  const qc = useQueryClient();
  const test = useServerFn(testSmtp);
  const fetchSmtp = useServerFn(getSmtpSettings);
  const save = useServerFn(saveSmtpSettings);
  const { data: smtp } = useQuery({
    queryKey: ["smtp_settings"],
    queryFn: () => fetchSmtp(),
  });

  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const isConfigured = smtp?.smtp_configured === true;

  useEffect(() => {
    if (smtp?.smtp_configured) {
      setSenderEmail(smtp.sender_email);
      setSenderName(smtp.sender_name ?? "");
      setHost(smtp.smtp_host);
      setPort(smtp.smtp_port);
    }
  }, [smtp]);

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: { senderEmail, senderName: senderName || undefined, host, port, password: password || undefined } });
      toast.success("SMTP settings saved");
      setPassword("");
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
          <CardDescription>For Gmail, create an <a className="text-primary underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">App Password</a> (requires 2FA). Your password is stored encrypted on the server and is never sent back to your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Sender email *</Label><Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="you@gmail.com" /></div>
            <div><Label>Sender name</Label><Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your full name" /></div>
            <div><Label>SMTP host *</Label><Input value={host} onChange={(e) => setHost(e.target.value)} /></div>
            <div><Label>SMTP port *</Label><Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} /></div>
          </div>
          <div>
            <Label>App password {isConfigured ? "(leave blank to keep current)" : "*"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isConfigured ? "•••••••• (saved)" : "••••••••••••••••"} />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={saving || !senderEmail || (!isConfigured && !password)}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save</Button>
            <Button variant="outline" onClick={onTest} disabled={testing || !isConfigured}>{testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Test connection</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
