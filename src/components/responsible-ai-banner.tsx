import { ShieldAlert } from "lucide-react";

export function ResponsibleAiBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-accent/40 p-3 text-xs text-accent-foreground">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">
        <span className="font-medium">Responsible AI:</span> Outputs may not always be accurate.
        Please review before use. Avoid sharing sensitive or confidential information.
      </p>
    </div>
  );
}