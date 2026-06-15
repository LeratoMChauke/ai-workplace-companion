import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

export function OutputActions({
  text,
  filename = "output.md",
  onRegenerate,
  onSave,
  saving,
  regenerating,
}: {
  text: string;
  filename?: string;
  onRegenerate?: () => void;
  onSave?: () => void;
  saving?: boolean;
  regenerating?: boolean;
}) {
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={copy} disabled={!text}>
        <Copy className="h-3.5 w-3.5" /> Copy
      </Button>
      <Button size="sm" variant="outline" onClick={download} disabled={!text}>
        <Download className="h-3.5 w-3.5" /> Download
      </Button>
      {onRegenerate && (
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      )}
      {onSave && (
        <Button size="sm" onClick={onSave} disabled={saving || !text}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
      )}
    </div>
  );
}