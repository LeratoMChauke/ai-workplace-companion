import type { ReactNode } from "react";
import { ResponsibleAiBanner } from "./responsible-ai-banner";

export function ModuleShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-[var(--shadow-soft)]">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
      <div className="mt-8">
        <ResponsibleAiBanner />
      </div>
    </div>
  );
}