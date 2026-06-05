import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCircle2, XCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SmartApply" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [apps, recent, roles] = await Promise.all([
        supabase.from("applications").select("status"),
        supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("job_roles").select("id"),
      ]);
      const list = apps.data ?? [];
      return {
        total: list.length,
        sent: list.filter((a) => a.status === "sent").length,
        failed: list.filter((a) => a.status === "failed").length,
        roles: roles.data?.length ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const stats = [
    { label: "Total Sent", value: data?.total ?? 0, icon: Send, color: "text-primary" },
    { label: "Successful", value: data?.sent ?? 0, icon: CheckCircle2, color: "text-success" },
    { label: "Failed", value: data?.failed ?? 0, icon: XCircle, color: "text-destructive" },
    { label: "Job Roles", value: data?.roles ?? 0, icon: FileText, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your job application activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} style={{ boxShadow: "var(--shadow-elegant)" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold mt-2">{isLoading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Link to="/history"><Button variant="ghost" size="sm">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {!data?.recent.length && <p className="text-sm text-muted-foreground">No applications yet. <Link to="/single-apply" className="text-primary underline">Send your first one</Link>.</p>}
            <ul className="divide-y divide-border">
              {data?.recent.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.recipient_email} · {a.role_name}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "sent" ? "bg-success/15 text-success" : a.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to="/single-apply"><Button className="w-full justify-start" variant="default"><Send className="h-4 w-4 mr-2" />New application</Button></Link>
            <Link to="/roles"><Button className="w-full justify-start" variant="outline"><FileText className="h-4 w-4 mr-2" />Manage roles</Button></Link>
            <Link to="/smtp"><Button className="w-full justify-start" variant="outline">Configure SMTP</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
