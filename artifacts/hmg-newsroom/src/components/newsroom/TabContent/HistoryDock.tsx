import { History, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryDockProps {
  history: string[];
  isGenerating: boolean;
  onPick: (entry: string) => void;
  onRemove: (entry: string) => void;
  onClear: () => void;
}

export function HistoryDock({
  history,
  isGenerating,
  onPick,
  onRemove,
  onClear,
}: HistoryDockProps) {
  return (
    <AnimatePresence initial={false}>
      {history.length > 0 && (
        <motion.div
          key="history"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              Recent
            </div>
            <button
              onClick={onClear}
              disabled={isGenerating}
              className="text-[11px] text-muted-foreground/60 hover:text-foreground/80 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {history.map((entry) => (
              <div
                key={entry}
                className="flex items-center gap-1 shrink-0 max-w-[260px] rounded-full border border-border bg-secondary/40 hover:border-[var(--brand)]/60 transition-colors"
              >
                <button
                  onClick={() => onPick(entry)}
                  disabled={isGenerating}
                  title={entry}
                  className="text-xs text-foreground/80 hover:text-foreground py-1.5 pl-3 pr-1 truncate disabled:opacity-50"
                >
                  {entry}
                </button>
                <button
                  onClick={() => onRemove(entry)}
                  disabled={isGenerating}
                  className="p-1 mr-1 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-foreground/10 disabled:opacity-40"
                  aria-label="Remove from history"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
