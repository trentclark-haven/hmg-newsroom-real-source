import { revenueMatrix } from "@/components/newsroom/sales/mockMaximillionV3Data";
import { Factory, Gauge, TimerReset } from "lucide-react";

const difficultyTone = {
  Low: "text-emerald-700 dark:text-emerald-100 border-emerald-300/20 bg-emerald-400/10",
  Medium: "text-amber-700 dark:text-amber-100 border-amber-300/20 bg-amber-300/10",
  High: "text-red-700 dark:text-red-100 border-red-300/20 bg-red-400/10",
};

const statusTone = {
  Ready: "text-emerald-700 dark:text-emerald-100",
  Research: "text-sky-700 dark:text-sky-100",
  Packaging: "text-amber-700 dark:text-amber-100",
  Future: "text-foreground",
};

export function HavenMoneyMachine() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Factory className="w-4 h-4" />
            <h3 className="text-sm font-black">Haven Money Machine</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Revenue Opportunity Matrix across advertising, sponsors, products,
            services, events, licensing, and media inventory.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Opportunity matrix
        </span>
      </div>

      <div className="mt-3 grid gap-2 2xl:hidden">
        {revenueMatrix.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-[12px] font-black leading-snug text-foreground">
                  {item.category}
                </h4>
                <p className="mt-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
                  {item.estimatedRevenue}
                </p>
              </div>
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-black shrink-0 ${
                  difficultyTone[item.difficulty]
                }`}
              >
                {item.difficulty}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md border border-border/35 bg-secondary/25 p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Startup cost
                </div>
                <div className="mt-1 text-foreground/82">{item.startupCost}</div>
              </div>
              <div className="rounded-md border border-border/35 bg-secondary/25 p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Time
                </div>
                <div className="mt-1 text-foreground/82">{item.timeInvestment}</div>
              </div>
            </div>
            <div
              className={`mt-3 inline-flex items-center gap-1 text-[11px] font-black ${
                statusTone[item.status]
              }`}
            >
              <Gauge className="w-3 h-3" />
              {item.status}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {item.notes}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-3 hidden overflow-x-auto rounded-lg border border-border/45 2xl:block">
        <table className="w-full min-w-[860px] text-left text-[11px]">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Category
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Startup cost
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Time
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Estimated revenue
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-2 font-black uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/35">
            {revenueMatrix.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-2 py-2 font-black text-foreground">
                  {item.category}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-black ${
                      difficultyTone[item.difficulty]
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </td>
                <td className="px-2 py-2 text-foreground/82">
                  {item.startupCost}
                </td>
                <td className="px-2 py-2 text-foreground/82">
                  <span className="inline-flex items-center gap-1">
                    <TimerReset className="w-3 h-3 text-muted-foreground" />
                    {item.timeInvestment}
                  </span>
                </td>
                <td className="px-2 py-2 text-emerald-700 dark:text-emerald-100 font-black">
                  {item.estimatedRevenue}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex items-center gap-1 font-black ${
                      statusTone[item.status]
                    }`}
                  >
                    <Gauge className="w-3 h-3" />
                    {item.status}
                  </span>
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
