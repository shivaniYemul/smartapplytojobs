import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "Manage Roles — SmartApply" }] }),
  component: RolesPage,
});

type Role = {
  id: string; role_name: string; resume_path: string | null; resume_name: string | null;
  subject_template: string; email_template: string;
};

const DEFAULT_SUBJECT = "Application for {role} — {name}";
const DEFAULT_BODY = `Dear {greeting},

I am writing to express my strong interest in the {role} position at {company}. With my relevant skills and experience, I believe I would be a valuable addition to your team.

Please find my resume attached for your review. I would welcome the opportunity to discuss how my background aligns with your needs.

Best regards,
{name}`;

function RolesPage() {
  const qc = useQueryClient();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["job_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_roles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Role[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Roles</h1>
          <p className="text-muted-foreground mt-1">Add job roles with their own resume and email template.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-2" />Add Role</Button></DialogTrigger>
          <RoleDialog key={editing?.id ?? "new"} role={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !roles.length && (
        <Card><CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No roles yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first role to start applying.</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add your first role</Button>
        </CardContent></Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{r.role_name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {r.resume_name ?? "No resume uploaded"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={async () => {
                  if (!confirm(`Delete "${r.role_name}"?`)) return;
                  if (r.resume_path) await supabase.storage.from("resumes").remove([r.resume_path]);
                  await supabase.from("job_roles").delete().eq("id", r.id);
                  toast.success("Role deleted");
                  qc.invalidateQueries({ queryKey: ["job_roles"] });
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-2">{r.subject_template}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoleDialog({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(role?.role_name ?? "");
  const [subject, setSubject] = useState(role?.subject_template ?? DEFAULT_SUBJECT);
  const [body, setBody] = useState(role?.email_template ?? DEFAULT_BODY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      let resume_path = role?.resume_path ?? null;
      let resume_name = role?.resume_name ?? null;
      if (file) {
        if (file.type !== "application/pdf") throw new Error("Resume must be a PDF");
        if (file.size > 5 * 1024 * 1024) throw new Error("PDF must be under 5MB");
        const path = `${user.id}/${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { contentType: "application/pdf" });
        if (upErr) throw upErr;
        if (role?.resume_path) await supabase.storage.from("resumes").remove([role.resume_path]);
        resume_path = path;
        resume_name = file.name;
      }

      if (role) {
        const { error } = await supabase.from("job_roles").update({ role_name: name, subject_template: subject, email_template: body, resume_path, resume_name }).eq("id", role.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_roles").insert({ user_id: user.id, role_name: name, subject_template: subject, email_template: body, resume_path, resume_name });
        if (error) throw error;
      }
      toast.success(role ? "Role updated" : "Role created");
      qc.invalidateQueries({ queryKey: ["job_roles"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{role ? "Edit role" : "New role"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label>Role name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Java Developer" maxLength={100} /></div>
        <div>
          <Label>Resume (PDF, max 5MB)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {(file || role?.resume_name) && <span className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" />{file?.name ?? role?.resume_name}</span>}
          </div>
        </div>
        <div>
          <Label>Subject template</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Variables: {"{role}, {company}, {name}"}</p>
        </div>
        <div>
          <Label>Email body template</Label>
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Variables: {"{role}, {company}, {greeting}, {name}, {jobDescription}"}</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}
