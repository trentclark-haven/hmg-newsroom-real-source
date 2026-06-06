import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  appendConversationalMemory,
  founderMemoryCategories,
  readFounderMemoryEntries,
  writeFounderMemoryEntries,
  type FounderMemoryCategory,
  type FounderMemoryEntry,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import { BookOpen, FileUp, Mic, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export function FounderMemoryCenter() {
  const [entries, setEntries] = useState<FounderMemoryEntry[]>(() =>
    readFounderMemoryEntries(),
  );
  const [category, setCategory] = useState<FounderMemoryCategory>("Business");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const grouped = useMemo(
    () =>
      founderMemoryCategories.map((item) => ({
        category: item,
        entries: entries.filter((entry) => entry.category === item).slice(0, 3),
      })),
    [entries],
  );

  useEffect(() => {
    writeFounderMemoryEntries(entries);
  }, [entries]);

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !note.trim()) {
      toast.error("Founder memory needs a title and note.");
      return;
    }
    const entry: FounderMemoryEntry = {
      id: `founder-memory-${Date.now().toString(36)}`,
      category,
      title: title.trim(),
      note: note.trim(),
      kind: "manual",
      createdAt: new Date().toLocaleString(),
    };
    setEntries((current) => [entry, ...current].slice(0, 80));
    appendConversationalMemory("conversationSummaries", `${category}: ${entry.title}`);
    setTitle("");
    setNote("");
    toast.success("Founder memory saved locally");
  }

  function addPlaceholder(kind: "voice-placeholder" | "document-placeholder") {
    const entry: FounderMemoryEntry = {
      id: `${kind}-${Date.now().toString(36)}`,
      category: kind === "voice-placeholder" ? "Personal" : "Operations",
      title:
        kind === "voice-placeholder"
          ? "Voice note draft"
          : "Uploaded document intake marker",
      note:
        kind === "voice-placeholder"
          ? "Browser Voice can store founder lessons here after Trent approves microphone access."
          : "Document upload can attach founder docs here after parsing is safely implemented.",
      kind,
      createdAt: new Date().toLocaleString(),
    };
    setEntries((current) => [entry, ...current].slice(0, 80));
    toast.success("Placeholder saved locally");
  }

  return (
    <section className="rounded-lg border border-amber-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
            <BookOpen className="h-4 w-4" />
            <h3 className="text-sm font-black">Founder Memory Evolution</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Manual local memory for founder lessons, wins, mistakes, ideas,
            drafts, and operating notes. No AI reasoning required.
          </p>
        </div>
        <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-100">
          Local storage
        </span>
      </div>

      <form onSubmit={addEntry} className="mt-3 rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as FounderMemoryCategory)}
            className="h-10 rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
            aria-label="Founder memory category"
          >
            {founderMemoryCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 bg-secondary/40 text-[12px]"
            placeholder="Founder lesson, win, mistake, or idea title"
            aria-label="Founder memory title"
          />
        </div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-2 min-h-[74px] resize-none bg-secondary/40 text-[12px]"
          placeholder="What should Maximillion remember?"
          aria-label="Founder memory note"
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Button type="submit" className="h-10 text-[11px]">
            <Save className="h-3.5 w-3.5" />
            Save memory
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addPlaceholder("voice-placeholder")}
            className="h-10 text-[11px] bg-secondary/25"
          >
            <Mic className="h-3.5 w-3.5" />
            Voice note
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addPlaceholder("document-placeholder")}
            className="h-10 text-[11px] bg-secondary/25"
          >
            <FileUp className="h-3.5 w-3.5" />
            Doc marker
          </Button>
        </div>
      </form>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((group) => (
          <div
            key={group.category}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3 min-w-0"
          >
            <div className="flex items-center gap-2 text-[12px] font-black text-foreground">
              <Plus className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
              {group.category}
            </div>
            <div className="mt-2 space-y-2">
              {group.entries.length ? (
                group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border/40 bg-secondary/25 p-2"
                  >
                    <div className="text-[11px] font-black text-foreground">
                      {entry.title}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {entry.note}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  No notes yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
