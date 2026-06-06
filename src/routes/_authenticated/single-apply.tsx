import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateApplicationEmail } from "@/lib/ai.functions";
import { sendApplication, getSmtpSettings } from "@/lib/mailer.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/single-apply")({
  head: () => ({ meta: [{ title: "Single Apply — SmartApply" }] }),
  component: SingleApply,
});

function SingleApply() {
  const generate = useServerFn(generateApplicationEmail);
  const send = useServerFn(sendApplication);
  const fetchSmtp = useServerFn(getSmtpSettings);

  const { data: roles = [] } = useQuery({
    queryKey: ["job_roles"],
    queryFn: async () => (await supabase.from("job_roles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: smtp } = useQuery({
    queryKey: ["smtp_settings"],
    queryFn: () => fetchSmtp(),
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const [recipient, setRecipient] = useState("");
  const [company, setCompany] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [jobDesc, setJobDesc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const role = roles.find((r) => r.id === roleId);

  async function onGenerate() {
    if (!role) { toast.error("Select a role first"); return; }
    setGenerating(true);
    try {
      const out = await generate({ data: { roleName: role.role_name, companyName: company || undefined, jobDescription: jobDesc || undefined, senderName: profile?.full_name || undefined } });
      setSubject(out.subject);
      setBody(out.body);
      toast.success("Email generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally { setGenerating(false); }
  }

  async function onSend() {
    if (!recipient || !subject || !body || !role) { toast.error("Fill all required fields"); return; }
    setSending(true);
    try {
      await send({ data: { recipientEmail: recipient, companyName: company || undefined, roleId: role.id, subject, body } });
      toast.success("Application sent!");
      setRecipient(""); setCompany(""); setJobDesc(""); setSubject(""); setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Single Apply</h1>
        <p className="text-muted-foreground mt-1">Generate and send one tailored application.</p>
      </div>

      {!smtp && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="py-4 flex items-center gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span>SMTP not configured. <Link to="/smtp" className="text-primary underline">Set it up</Link> before sending.</span>
          </CardContent>
        </Card>
      )}
      {!roles.length && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="py-4 flex items-center gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span>No roles yet. <Link to="/roles" className="text-primary underline">Create one</Link> to attach a resume.</span>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle><CardDescription>What you're applying to.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Recipient email *</Label><Input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="hr@company.com" /></div>
            <div><Label>Company name</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" /></div>
            <div>
              <Label>Role *</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Job description</Label><Textarea rows={5} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the JD for a more tailored email (optional)" /></div>
            <Button onClick={onGenerate} disabled={generating || !role} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate with AI
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preview & send</CardTitle><CardDescription>Edit before sending. Resume auto-attached.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Generated subject appears here" /></div>
            <div><Label>Email body</Label><Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Generated body appears here" className="font-mono text-sm" /></div>
            {role?.resume_name && <p className="text-xs text-muted-foreground">📎 Attachment: {role.resume_name}</p>}
            <Button onClick={onSend} disabled={sending || !smtp || !roles.length} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send application
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
