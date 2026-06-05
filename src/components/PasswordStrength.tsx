import { checkPassword, pwScore } from "@/lib/password";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordStrength({ password }: { password: string }) {
  const c = checkPassword(password);
  const score = pwScore(c);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-warning", "bg-success", "bg-success"];

  const items: [keyof typeof c, string][] = [
    ["length", "8+ characters"],
    ["upper", "Uppercase letter"],
    ["lower", "Lowercase letter"],
    ["number", "Number"],
    ["special", "Special character"],
  ];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i < score ? colors[score] : "bg-muted")} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{password ? labels[score] : "Enter a password"}</p>
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {items.map(([k, label]) => (
          <li key={k} className={cn("flex items-center gap-1.5", c[k] ? "text-success" : "text-muted-foreground")}>
            {c[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
