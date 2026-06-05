import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Generate ATS-friendly subject + body using Lovable AI Gateway
export const generateApplicationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleName: string; companyName?: string; jobDescription?: string; senderName?: string }) =>
    z.object({
      roleName: z.string().min(1).max(200),
      companyName: z.string().max(200).optional(),
      jobDescription: z.string().max(5000).optional(),
      senderName: z.string().max(200).optional(),
    }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const system = "You are an expert at writing ATS-friendly, professional job application emails. Keep emails concise (under 200 words), warm but professional, and highlight relevant value. Always sign off with the sender's name.";
    const greeting = data.companyName ? `Hiring Team at ${data.companyName}` : "Hiring Manager";
    const user = `Write a job application email.
Role: ${data.roleName}
Company: ${data.companyName ?? "(unspecified — use 'your company')"}
Sender name: ${data.senderName ?? "(use placeholder [Your Name])"}
${data.jobDescription ? `Job description excerpt:\n${data.jobDescription}\n` : ""}
Greeting: "Dear ${greeting},"

Return JSON with keys "subject" and "body". The subject should be specific and ATS-friendly. The body should be plain text with line breaks, no markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "compose_email",
            description: "Return the composed subject and body.",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "compose_email" } },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit hit, try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no content");
    const parsed = JSON.parse(args) as { subject: string; body: string };
    return parsed;
  });
