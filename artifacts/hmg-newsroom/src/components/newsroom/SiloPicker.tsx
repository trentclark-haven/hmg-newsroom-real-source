import { verticals } from "@/lib/mock-data";
import type { Silo as ApiSilo } from "@workspace/api-client-react";

interface SiloPickerProps {
  value: ApiSilo;
  onChange: (silo: ApiSilo) => void;
}

export function SiloPicker({ value, onChange }: SiloPickerProps) {
  return (
    <div className="px-1 pb-2">
      <div className="flex flex-wrap gap-1.5">
        {verticals.map((v) => {
          const active = v.id === value;
          return (
            <button
              key={v.id}
              data-testid={`silo-pick-${v.id}`}
              onClick={() => onChange(v.id as ApiSilo)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${
                active
                  ? "border-transparent text-foreground"
                  : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
              }`}
              style={
                active
                  ? { background: v.accentBg || v.color, color: v.onAccent }
                  : undefined
              }
            >
              {v.logo && (
                <img
                  src={v.logo}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-[12px] font-bold uppercase tracking-wide">
                {v.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
