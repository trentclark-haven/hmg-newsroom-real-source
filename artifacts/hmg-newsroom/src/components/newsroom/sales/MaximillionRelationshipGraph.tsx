import {
  relationshipGraphConnections,
  relationshipGraphEntities,
  type RelationshipEntityType,
  type RelationshipLabel,
} from "@/components/newsroom/sales/mockMaximillionV8Data";
import { Building2, CalendarDays, MapPin, Network, Star, UserRound } from "lucide-react";

const entityTone: Record<RelationshipEntityType, string> = {
  Person: "border-sky-300/25 bg-sky-400/10 text-sky-700 dark:text-sky-100",
  Company: "border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  Brand: "border-violet-300/25 bg-violet-400/10 text-violet-700 dark:text-violet-100",
  Event: "border-amber-300/25 bg-amber-300/10 text-amber-700 dark:text-amber-100",
  City: "border-border bg-slate-300/10 text-foreground",
};

const labelTone: Record<RelationshipLabel, string> = {
  friend: "bg-sky-400/10 text-sky-700 dark:text-sky-100 border-sky-300/20",
  business: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-100 border-emerald-300/20",
  media: "bg-violet-400/10 text-violet-700 dark:text-violet-100 border-violet-300/20",
  investor: "bg-fuchsia-400/10 text-fuchsia-700 dark:text-fuchsia-100 border-fuchsia-300/20",
  sponsor: "bg-amber-300/10 text-amber-700 dark:text-amber-100 border-amber-300/20",
  talent: "bg-pink-400/10 text-pink-700 dark:text-pink-100 border-pink-300/20",
  "high value": "bg-red-400/10 text-red-700 dark:text-red-100 border-red-300/20",
  "warm lead": "bg-emerald-400/10 text-emerald-700 dark:text-emerald-100 border-emerald-300/20",
  "cold lead": "bg-slate-300/10 text-foreground border-border",
};

export function MaximillionRelationshipGraph() {
  const trent = relationshipGraphEntities.find((entity) => entity.id === "trent");
  const otherEntities = relationshipGraphEntities.filter((entity) => entity.id !== "trent");

  return (
    <section className="rounded-lg border border-sky-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
            <Network className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Relationship Graph</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Visual relationship intelligence for people, companies, brands,
            events, cities, and the next action attached to each connection.
          </p>
        </div>
        <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-100">
          Local graph memory
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-sky-200/15 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),rgba(0,0,0,0.28)_58%)] p-3">
        {trent && (
          <div className="mx-auto max-w-md rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/25 bg-secondary/30 text-emerald-700 dark:text-emerald-100">
              <UserRound className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-[13px] font-black text-foreground">
              {trent.label}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {trent.note}
            </p>
          </div>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {otherEntities.map((entity) => (
            <div
              key={entity.id}
              className="rounded-lg border border-border/45 bg-secondary/35 p-3 min-w-0"
            >
              <div className="flex items-start gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${entityTone[entity.type]}`}
                >
                  <EntityIcon type={entity.type} />
                </div>
                <div className="min-w-0">
                  <h5 className="truncate text-[12px] font-black text-foreground">
                    {entity.label}
                  </h5>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {entity.type}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {entity.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {relationshipGraphConnections.map((connection) => {
          const from = relationshipGraphEntities.find((entity) => entity.id === connection.from);
          const to = relationshipGraphEntities.find((entity) => entity.id === connection.to);
          return (
            <article
              key={connection.id}
              className="rounded-lg border border-border/45 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[12px] font-black leading-snug text-foreground">
                    {from?.label ?? connection.from} {"->"}{" "}
                    {to?.label ?? connection.to}
                  </h4>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Last interaction: {connection.lastInteraction}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-100">
                  {connection.strengthScore}/100
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {connection.labels.map((label) => (
                  <span
                    key={label}
                    className={`rounded-full border px-2 py-1 text-[10px] font-bold ${labelTone[label]}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-md border border-sky-200/15 bg-sky-300/[0.06] p-2 text-[11px] leading-relaxed text-sky-700 dark:text-sky-50/82">
                <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-200" />
                {connection.recommendedNextAction}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EntityIcon({ type }: { type: RelationshipEntityType }) {
  if (type === "Person") return <UserRound className="h-4 w-4" />;
  if (type === "Company") return <Building2 className="h-4 w-4" />;
  if (type === "Event") return <CalendarDays className="h-4 w-4" />;
  if (type === "City") return <MapPin className="h-4 w-4" />;
  return <Network className="h-4 w-4" />;
}
