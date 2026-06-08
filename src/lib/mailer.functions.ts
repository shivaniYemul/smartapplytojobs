import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface SmtpConfig {
  host: string; port: number; user: string; pass: string; senderName?: string;
}

async function sendViaNodemailer(cfg: SmtpConfig, opts: {
  to: string; subject: string; text: string; attachment?: { filename: string; content: Buffer; contentType: string };
}) {
  // Dynamic import to keep client bundle clean
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transporter.verify();
  const info = await transporter.sendMail({
    from: cfg.senderName ? `"${cfg.senderName}" <${cfg.user}>` : cfg.user,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: opts.attachment ? [{ filename: opts.attachment.filename, content: opts.attachment.content, contentType: opts.attachment.contentType }] : undefined,
  });
  return info.messageId;
}

// Response schema — enforced at runtime so secret columns can never leak,
// even if a future change adds `select("*")` or spreads the raw DB row.
export const SmtpSettingsResponseSchema = z.discriminatedUnion("smtp_configured", [
  z.object({ smtp_configured: z.literal(false) }).strict(),
  z.object({
    smtp_configured: z.literal(true),
    sender_email: z.string(),
    sender_name: z.string().nullable(),
    smtp_host: z.string(),
    smtp_port: z.number(),
    updated_at: z.string(),
  }).strict(),
]);
export type SmtpSettingsResponse = z.infer<typeof SmtpSettingsResponseSchema>;

export const getSmtpSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SmtpSettingsResponse> => {
    const { data } = await context.supabase
      .from("smtp_settings")
      .select("sender_email, sender_name, smtp_host, smtp_port, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    const response: SmtpSettingsResponse = !data
      ? { smtp_configured: false }
      : {
          smtp_configured: true,
          sender_email: data.sender_email,
          sender_name: data.sender_name,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          updated_at: data.updated_at,
        };
    // `.strict()` throws if any unknown key (e.g. smtp_password) sneaks in.
    return SmtpSettingsResponseSchema.parse(response);
  });

const SaveSmtpResponseSchema = z.object({ ok: z.literal(true) }).strict();
const TestSmtpResponseSchema = z.union([
  z.object({ ok: z.literal(true) }).strict(),
  z.object({ ok: z.literal(false), error: z.string() }).strict(),
]);
const SendApplicationResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
}).strict();

export const saveSmtpSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { senderEmail: string; senderName?: string; host: string; port: number; password?: string }) =>
    z.object({
      senderEmail: z.string().email().max(255),
      senderName: z.string().max(200).optional(),
      host: z.string().min(1).max(255),
      port: z.number().int().min(1).max(65535),
      password: z.string().min(1).max(500).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("smtp_settings").select("user_id").eq("user_id", userId).maybeSingle();
    if (!existing) {
      if (!data.password) throw new Error("Password is required when configuring SMTP for the first time.");
      const { error } = await supabase.from("smtp_settings").insert({
        user_id: userId, sender_email: data.senderEmail, sender_name: data.senderName ?? null,
        smtp_host: data.host, smtp_port: data.port, smtp_password: data.password,
      });
      if (error) throw new Error(error.message);
    } else {
      const update: {
        sender_email: string; sender_name: string | null; smtp_host: string; smtp_port: number; smtp_password?: string;
      } = {
        sender_email: data.senderEmail, sender_name: data.senderName ?? null,
        smtp_host: data.host, smtp_port: data.port,
      };
      if (data.password) update.smtp_password = data.password;
      const { error } = await supabase.from("smtp_settings").update(update).eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    return SaveSmtpResponseSchema.parse({ ok: true });
  });

export const testSmtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: smtp, error } = await context.supabase.from("smtp_settings").select("*").eq("user_id", context.userId).maybeSingle();
    if (error || !smtp) throw new Error("SMTP settings not configured");
    try {
      const nodemailer = (await import("nodemailer")).default;
      const t = nodemailer.createTransport({
        host: smtp.smtp_host, port: smtp.smtp_port, secure: smtp.smtp_port === 465,
        auth: { user: smtp.sender_email, pass: smtp.smtp_password },
      });
      await t.verify();
      return TestSmtpResponseSchema.parse({ ok: true });
    } catch (e) {
      return TestSmtpResponseSchema.parse({ ok: false, error: e instanceof Error ? e.message : "Connection failed" });
    }
  });

export const sendApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { recipientEmail: string; companyName?: string; roleId: string; subject: string; body: string }) =>
    z.object({
      recipientEmail: z.string().email().max(255),
      companyName: z.string().max(200).optional(),
      roleId: z.string().uuid(),
      subject: z.string().min(1).max(500),
      body: z.string().min(1).max(10000),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: smtp } = await supabase.from("smtp_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!smtp) throw new Error("Please configure SMTP settings first.");

    const { data: role } = await supabase.from("job_roles").select("*").eq("id", data.roleId).maybeSingle();
    if (!role) throw new Error("Selected role not found.");

    // Create pending application record
    const { data: app, error: appErr } = await supabase.from("applications").insert({
      user_id: userId,
      recipient_email: data.recipientEmail,
      company_name: data.companyName ?? null,
      role_name: role.role_name,
      subject: data.subject,
      body: data.body,
      status: "pending",
      resume_used: role.resume_name,
    }).select("*").single();
    if (appErr || !app) throw new Error(appErr?.message ?? "Failed to log application");

    // Fetch resume bytes if present (via admin to avoid RLS path issues server-side)
    let attachment;
    if (role.resume_path) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: blob, error: dlErr } = await supabaseAdmin.storage.from("resumes").download(role.resume_path);
      if (!dlErr && blob) {
        const buf = Buffer.from(await blob.arrayBuffer());
        attachment = { filename: role.resume_name ?? "resume.pdf", content: buf, contentType: "application/pdf" };
      }
    }

    try {
      await sendViaNodemailer(
        { host: smtp.smtp_host, port: smtp.smtp_port, user: smtp.sender_email, pass: smtp.smtp_password, senderName: smtp.sender_name ?? undefined },
        { to: data.recipientEmail, subject: data.subject, text: data.body, attachment },
      );
      await supabase.from("applications").update({ status: "sent" }).eq("id", app.id);
      return { ok: true, id: app.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      await supabase.from("applications").update({ status: "failed", error_message: msg }).eq("id", app.id);
      throw new Error(msg);
    }
  });
