import React from "react";
import { getBrandVoiceProfile } from "@/lib/hmg/brandVoiceProfiles";

interface BrandBadgeProps {
  brandId: string;
  showTone?: boolean;
  className?: string;
}

const fallbackBrandStyles: Record<string, { color: string; backgroundColor: string; onAccent: string }> = {
  hiphop: { color: "#2EC5FF", backgroundColor: "rgba(46,197,255,0.14)", onAccent: "#EAF8FF" },
  rap: { color: "#FF2E2E", backgroundColor: "rgba(255,46,46,0.14)", onAccent: "#FFECEC" },
  music: { color: "#D4A23A", backgroundColor: "rgba(212,162,58,0.16)", onAccent: "#FFF5D6" },
  sports: { color: "#F26A21", backgroundColor: "rgba(242,106,33,0.16)", onAccent: "#FFF1E8" },
  canna: { color: "#35C85A", backgroundColor: "rgba(53,200,90,0.16)", onAccent: "#EFFFF2" },
  fit: { color: "#FF4FD8", backgroundColor: "rgba(255,79,216,0.14)", onAccent: "#FFF0FB" },
  master: { color: "#D4A23A", backgroundColor: "rgba(212,162,58,0.16)", onAccent: "#FFF5D6" },
};

function normalizeBrandId(brandId: string) {
  const id = brandId.toLowerCase();
  if (id.includes("hiphop")) return "hiphop";
  if (id.includes("rap")) return "rap";
  if (id.includes("sports")) return "sports";
  if (id.includes("canna")) return "canna";
  if (id.includes("fit")) return "fit";
  if (id.includes("music")) return "music";
  return "master";
}

export function BrandBadge({ brandId, showTone = true, className = "" }: BrandBadgeProps) {
  const profile = getBrandVoiceProfile(brandId);
  const brandKey = normalizeBrandId(brandId);
  const style = fallbackBrandStyles[brandKey] || fallbackBrandStyles.master;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
        style={{
          backgroundColor: style.backgroundColor,
          color: style.onAccent,
          border: `1px solid ${style.color}66`,
        }}
      >
        {profile.name}
      </div>
      {showTone && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          {profile.toneLabel}
        </span>
      )}
    </div>
  );
}
