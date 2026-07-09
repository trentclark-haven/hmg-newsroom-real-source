import { useEffect, useState } from "react";
import { useFounderSession } from "@/lib/useFounderSession";
import { readGlobalSilo } from "@/lib/globalSilo";
import { useSafeMode } from "@/lib/safeMode";

export function FounderControlRoom({ activeModule }: { activeModule: string }) {
  const { founder } = useFounderSession();
  const { enabled } = useSafeMode();
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!founder) return;
    fetch("/api/founder/diag").then((r) => r.json()).then(setDiag).catch(() => setDiag({ error: "diag_unavailable" }));
  }, [founder]);
  if (!founder) return null;
  return (
    <div className="mx-4 mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[10px]">
      <div className="font-bold uppercase tracking-wider">Founder Control Room</div>
      <div>selected silo: {readGlobalSilo()}</div>
      <div>safe mode: {enabled ? "on" : "off"}</div>
      <div>active module: {activeModule}</div>
      <div>api health: {String((diag?.health as string) ?? (diag ? "ok" : "loading"))}</div>
      <div>openai key present: {String((diag?.openaiKeyPresent as boolean) ? "yes" : "no")}</div>
      <div>deepgram key present: {String((diag?.deepgramKeyPresent as boolean) ? "yes" : "no")}</div>
      <div>elevenlabs key present: {String((diag?.elevenlabsKeyPresent as boolean) ? "yes" : "no")}</div>
      <div>wolf: artbot modes active · photoreal sanitizer active · upload diagnostics active · transcript hints active</div>
    </div>
  );
}
