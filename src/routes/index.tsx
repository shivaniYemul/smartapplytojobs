import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Zap, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Job Apply Assistant — AI-crafted job applications" },
      { name: "description", content: "Send personalized job applications with AI in seconds. Manage role-specific resumes, SMTP, and track every send." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-surface)" }} />
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-primary)" }}>S</div>
          <span className="font-semibold tracking-tight">SmartApply</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Get started</Button></Link>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-16 md:pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered job outreach
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Apply to dozens of jobs <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>in minutes, not hours.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate tailored emails with AI, attach the right resume per role, and send through your own Gmail SMTP. Single or bulk.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}><Button size="lg" className="gap-2">Create free account <Zap className="h-4 w-4" /></Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 text-left">
          {[
            { icon: Mail, title: "Your SMTP, your inbox", desc: "Send from your Gmail. Replies land in your inbox." },
            { icon: Sparkles, title: "AI-generated emails", desc: "ATS-friendly subject and body for every role." },
            { icon: Shield, title: "Per-user data isolation", desc: "Resumes, templates, and history are private." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur" style={{ boxShadow: "var(--shadow-elegant)" }}>
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
