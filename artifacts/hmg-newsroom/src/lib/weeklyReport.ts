import { verticals } from "./mock-data";
import { aggregateBySilo, startOfWeek, type UsageEvent } from "./useUsageStats";
import type { Sponsor } from "./sponsors";
import type { SalesLead } from "./sales";
import type { Assignment } from "./assignments";
import type { AuditEntry } from "./auditLog";

export interface WeeklyReport {
  generatedAt: string;
  weekStart: string;
  totals: {
    articlesGenerated: number;
    drafts: number;
    publishes: number;
    publishAttempts: number;
    publishFailures: number;
    imagesGenerated: number;
    clipsPackaged: number;
    sponsorsActive: number;
    sponsorsExpiring: number;
    salesLeadsAdded: number;
    tasksCompleted: number;
  };
  bySilo: Array<{
    silo: string;
    name: string;
    generated: number;
    drafts: number;
    published: number;
  }>;
  sponsors: Array<{ name: string; slot: string; silo: string; active: boolean }>;
  sales: Array<{ company: string; stage: string; spend: string }>;
  tasksCompleted: Array<{ title: string; assignedTo: string; silo: string }>;
}

export interface WeeklyReportInputs {
  events: UsageEvent[];
  audit: AuditEntry[];
  sponsors: Sponsor[];
  sales: SalesLead[];
  assignments: Assignment[];
}

export function buildWeeklyReport({
  events,
  audit,
  sponsors,
  sales,
  assignments,
}: WeeklyReportInputs): WeeklyReport {
  const weekStartTs = startOfWeek();
  const bySiloRaw = aggregateBySilo(
    events,
    weekStartTs,
    verticals.map((v) => v.id),
  );
  const bySilo = bySiloRaw.map((s) => {
    const v = verticals.find((x) => x.id === s.silo);
    return {
      silo: s.silo,
      name: v?.name ?? s.silo,
      generated: s.generated,
      drafts: s.drafts,
      published: s.published,
    };
  });

  const totals = {
    articlesGenerated: bySilo.reduce((sum, s) => sum + s.generated, 0),
    drafts: bySilo.reduce((sum, s) => sum + s.drafts, 0),
    publishes: bySilo.reduce((sum, s) => sum + s.published, 0),
    publishAttempts: countAuditSinceWeek(audit, weekStartTs, "publish-attempt"),
    publishFailures: countAuditSinceWeek(audit, weekStartTs, "publish-failure"),
    imagesGenerated: countAuditSinceWeek(audit, weekStartTs, "image-generated"),
    clipsPackaged: countAuditSinceWeek(audit, weekStartTs, "clip-packaged"),
    sponsorsActive: sponsors.filter((s) => s.active).length,
    sponsorsExpiring: sponsors.filter((s) => {
      if (!s.endDate) return false;
      const end = new Date(s.endDate).getTime();
      if (Number.isNaN(end)) return false;
      const horizon = Date.now() + 14 * 24 * 60 * 60 * 1000;
      return end <= horizon && end >= Date.now();
    }).length,
    salesLeadsAdded: sales.filter((l) => l.createdAt >= weekStartTs).length,
    tasksCompleted: assignments.filter(
      (a) => a.status === "done" && a.updatedAt >= weekStartTs,
    ).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    weekStart: new Date(weekStartTs).toISOString(),
    totals,
    bySilo,
    sponsors: sponsors.map((s) => ({
      name: s.name,
      slot: s.slot,
      silo: s.silo,
      active: s.active,
    })),
    sales: sales.map((l) => ({
      company: l.company,
      stage: l.stage,
      spend: l.proposedSpend,
    })),
    tasksCompleted: assignments
      .filter((a) => a.status === "done" && a.updatedAt >= weekStartTs)
      .map((a) => ({
        title: a.title,
        assignedTo: a.assignedTo,
        silo: a.silo,
      })),
  };
}

function countAuditSinceWeek(
  audit: AuditEntry[],
  weekStartTs: number,
  action: string,
): number {
  return audit.filter((e) => e.ts >= weekStartTs && e.action === action).length;
}

export function reportToMarkdown(r: WeeklyReport): string {
  const lines: string[] = [];
  lines.push(`# HMG Weekly Report`);
  lines.push(``);
  lines.push(`**Created:** ${r.generatedAt}`);
  lines.push(`**Week of:** ${r.weekStart.slice(0, 10)}`);
  lines.push(``);
  lines.push(`## Totals`);
  lines.push(`- Articles created: **${r.totals.articlesGenerated}**`);
  lines.push(`- Drafts saved: **${r.totals.drafts}**`);
  lines.push(`- Ready for Manual Publish receipts: **${r.totals.publishes}**`);
  lines.push(`- Manual publish attempts (audit): **${r.totals.publishAttempts}**`);
  lines.push(`- Manual publish failures (audit): **${r.totals.publishFailures}**`);
  lines.push(`- Images created: **${r.totals.imagesGenerated}**`);
  lines.push(`- Clips packaged: **${r.totals.clipsPackaged}**`);
  lines.push(`- Sponsor slots filled (active): **${r.totals.sponsorsActive}**`);
  lines.push(`- Sponsors expiring ≤14d: **${r.totals.sponsorsExpiring}**`);
  lines.push(`- Sales leads added this week: **${r.totals.salesLeadsAdded}**`);
  lines.push(`- Tasks completed this week: **${r.totals.tasksCompleted}**`);
  lines.push(``);
  lines.push(`## By Silo`);
  lines.push(`| Silo | Created | Drafts | Manual |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const s of r.bySilo) {
    lines.push(`| ${s.name} | ${s.generated} | ${s.drafts} | ${s.published} |`);
  }
  lines.push(``);
  if (r.sponsors.length) {
    lines.push(`## Sponsors`);
    for (const s of r.sponsors) {
      lines.push(
        `- **${s.name}** — ${s.slot} · ${s.silo} · ${s.active ? "active" : "inactive"}`,
      );
    }
    lines.push(``);
  }
  if (r.sales.length) {
    lines.push(`## Sales Pipeline`);
    for (const l of r.sales) {
      lines.push(`- **${l.company}** — ${l.stage}${l.spend ? ` · ${l.spend}` : ""}`);
    }
    lines.push(``);
  }
  if (r.tasksCompleted.length) {
    lines.push(`## Tasks Completed`);
    for (const t of r.tasksCompleted) {
      lines.push(`- ${t.title} — ${t.assignedTo} · ${t.silo}`);
    }
    lines.push(``);
  }
  return lines.join("\n");
}

export function reportToJson(r: WeeklyReport): string {
  return JSON.stringify(r, null, 2);
}

export function downloadReport(r: WeeklyReport) {
  const stamp = new Date().toISOString().slice(0, 10);
  download(`hmg-weekly-${stamp}.json`, reportToJson(r), "application/json");
  download(`hmg-weekly-${stamp}.md`, reportToMarkdown(r), "text/markdown");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
