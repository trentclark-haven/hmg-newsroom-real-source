import { salesGlossary } from "@/components/newsroom/sales/mockMaximillionData";
import { BookOpenText } from "lucide-react";

export function SalesGlossary() {
  return (
    <section className="rounded-lg border border-border/55 bg-secondary/35 p-3">
      <div className="flex items-center gap-2 text-emerald-300">
        <BookOpenText className="w-4 h-4" />
        <h3 className="text-sm font-black">Sales Vocabulary</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Quick operator definitions for the revenue board.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {salesGlossary.map((item) => (
          <div
            key={item.term}
            className="rounded-lg border border-border/45 bg-secondary/30 p-2.5"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-black text-emerald-700 dark:text-emerald-200">
                {item.term}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {item.label}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/80">
              {item.definition}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
