import { executiveMemoryState } from "@/components/newsroom/sales/mockMaximillionV3Data";
import {
  BookMarked,
  CalendarClock,
  Contact,
  Flag,
  History,
  MessageCircle,
  Target,
  type LucideIcon,
} from "lucide-react";

export function MaximillionExecutiveMemory() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <BookMarked className="w-4 h-4" />
            <h3 className="text-sm font-black">Maximillion Executive Memory</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Expanded local memory schema for contacts, relationships, lead
            history, sponsors, conversations, goals, and follow-up context.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Mock state schema
        </span>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <MemoryGroup
          icon={Contact}
          title="MaximillionContact"
          rows={executiveMemoryState.contacts.map(
            (contact) =>
              `${contact.name} · ${contact.company} · strength ${contact.relationshipStrength}`,
          )}
        />
        <MemoryGroup
          icon={MessageCircle}
          title="RelationshipNote"
          rows={executiveMemoryState.relationshipNotes.map(
            (note) => `${note.lastDiscussedTopic}: ${note.note}`,
          )}
        />
        <MemoryGroup
          icon={History}
          title="LeadHistory"
          rows={executiveMemoryState.leadHistory.map(
            (lead) => `${lead.leadName} · ${lead.stage} · ${lead.nextStep}`,
          )}
        />
        <MemoryGroup
          icon={Target}
          title="OpportunityHistory"
          rows={executiveMemoryState.opportunityHistory.map(
            (item) => `${item.title} · ${item.potentialValue} · ${item.status}`,
          )}
        />
        <MemoryGroup
          icon={CalendarClock}
          title="EventHistory / SponsorHistory"
          rows={[
            ...executiveMemoryState.eventHistory.map(
              (event) => `${event.eventName}: ${event.sponsorAngle}`,
            ),
            ...executiveMemoryState.sponsorHistory.map(
              (sponsor) => `${sponsor.sponsor}: ${sponsor.fitReason}`,
            ),
          ]}
        />
        <MemoryGroup
          icon={Flag}
          title="ConversationMemory / Goals"
          rows={[
            ...executiveMemoryState.conversationMemory.map(
              (memory) => `${memory.topic}: ${memory.takeaway}`,
            ),
            ...executiveMemoryState.businessGoals.map(
              (goal) => `${goal.goal} · ${goal.target} · ${goal.status}`,
            ),
            ...executiveMemoryState.priorityGoals.map(
              (goal) => `${goal.priority}: ${goal.goal} · ${goal.nextMove}`,
            ),
          ]}
        />
      </div>
    </section>
  );
}

function MemoryGroup({
  icon: Icon,
  title,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  rows: string[];
}) {
  return (
    <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row}
            className="rounded-md border border-border/35 bg-secondary/25 px-2 py-1.5 text-[11px] leading-relaxed text-foreground/82"
          >
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}
