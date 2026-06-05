import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, History as HistoryIcon } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Application History — SmartApply" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await supabase.from("applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => apps.filter((a) =>
    (status === "all" || a.status === status) &&
    (!q || a.recipient_email.toLowerCase().includes(q.toLowerCase()) || a.subject.toLowerCase().includes(q.toLowerCase()) || (a.company_name ?? "").toLowerCase().includes(q.toLowerCase()) || a.role_name.toLowerCase().includes(q.toLowerCase()))
  ), [apps, q, status]);

  function exportCsv() {
    const headers = ["Date", "Recipient", "Company", "Role", "Subject", "Status", "Resume"];
    const rows = filtered.map((a) => [
      format(new Date(a.created_at), "yyyy-MM-dd HH:mm"),
      a.recipient_email, a.company_name ?? "", a.role_name, a.subject, a.status, a.resume_used ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `applications-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Application History</h1>
        <p className="text-muted-foreground mt-1">Every email you've sent.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipient, company, subject…" className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </div>

          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && !filtered.length && (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No applications match your filters.</p>
            </div>
          )}

          {!!filtered.length && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Recipient</th><th className="py-2 pr-4">Company</th><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Subject</th><th className="py-2 pr-4">Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</td>
                      <td className="py-3 pr-4">{a.recipient_email}</td>
                      <td className="py-3 pr-4">{a.company_name ?? "—"}</td>
                      <td className="py-3 pr-4">{a.role_name}</td>
                      <td className="py-3 pr-4 max-w-xs truncate">{a.subject}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "sent" ? "bg-success/15 text-success" : a.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
