import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, User } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/80 px-3 py-2 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <h1 className="truncate text-sm font-semibold sm:text-base">
          AI Workplace Productivity Assistant
        </h1>
      </div>
      <div className="hidden items-center justify-center md:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          AI outputs may be inaccurate — always review before use.
        </span>
      </div>
      <div className="flex items-center gap-2 justify-self-end">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium leading-tight">You</p>
          <p className="text-[10px] leading-tight text-muted-foreground">Workspace</p>
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}