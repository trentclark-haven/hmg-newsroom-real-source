/**
 * Max Daily Money Brief — deterministic daily CRO summary generator.
 *
 * Summarizes the current Max Inbox into one actionable founder brief.
 * No model calls. No fake revenue. No fake outreach.
 *
 * Output kind: max-daily-money-brief
 * Truth: Local CRO Review | Founder Review Required | No Outreach Sent | No CRM Connected
 */
import type { MaxCROBrief } from "./maxCROEngine";

export interface MaxDailyBrief {
  id: string;
  createdAt: number;
  date: string;
  totalItems: number;
  priorityCount: number;
  followUpCount: number;
  ignoreCount: number;
  bestSponsorAngle: string;
  bestRelationshipFollowUp: string;
  bestContentToRevenue: string;
  bestOfflineMoneyPlay: string;
  whatToIgnoreToday: string;
  founderNextMove: string;
  riskWarning: string;
  reviewed: boolean;
}

function pickBest<T>(items: T[], picker: (i: T) => string): string {
  if (!items.length) return "Nothing in the inbox yet. Submit sources first.";
  for (const item of items) {
    const val = picker(item);
    if (val && val.length > 10) return val;
  }
  return picker(items[0]);
}

export function generateDailyBrief(items: MaxCROBrief[]): MaxDailyBrief {
  const reviewed = items.filter((i) => i.review !== null);
  const priority = reviewed.filter(
    (i) => i.status === "Max Review Drafted" || i.status === "Founder Review Required",
  );
  const followUps = items.filter((i) => i.status === "Relationship Follow-Up Needed");
  const ignored = items.filter((i) => i.status === "Ignore / No Money Move");

  const bestSponsorAngle = pickBest(
    reviewed,
    (i) => i.review?.sponsorAngle ?? "",
  );

  const bestRelFollowUp = pickBest(
    reviewed.filter((i) => i.review?.relationshipFollowUp?.includes("manager") ||
      i.review?.relationshipFollowUp?.includes("follow") ||
      i.review?.relationshipFollowUp?.includes("warm")),
    (i) => i.review?.relationshipFollowUp ?? "",
  ) || (reviewed.length ? (reviewed[0].review?.relationshipFollowUp ?? "No relationship signals in current inbox.") : "No reviews yet.");

  const bestContent = pickBest(reviewed, (i) => i.review?.contentToRevenue ?? "");
  const bestOffline = pickBest(reviewed, (i) => i.review?.offlineMoneyPlay ?? "");

  const ignoreNote =
    ignored.length > 0
      ? `${ignored.length} item${ignored.length === 1 ? "" : "s"} marked ignore. Don't revisit unless context changes significantly.`
      : reviewed.length > 0
      ? (reviewed[0].review?.whatToIgnore ?? "Nothing flagged to ignore today.")
      : "Nothing flagged to ignore today.";

  const founderMove =
    priority.length > 0
      ? priority[0].review?.founderNextMove ?? "Review top-priority items in the Max War Room."
      : followUps.length > 0
      ? "Check your follow-up queue — relationships go cold fast."
      : items.length > 0
      ? "Send your pending items through Max to get revenue reviews."
      : "Submit your first source to Max CRO Inbox to start building your pipeline.";

  const riskWarning =
    reviewed.length > 0
      ? (reviewed.find((i) => i.review?.riskReputationNote?.includes("risk") || i.review?.riskReputationNote?.includes("Hold") || i.review?.riskReputationNote?.includes("Flag"))?.review?.riskReputationNote ?? "No active reputation risks flagged in today's inbox.")
      : "No active reputation risks. Keep it clean.";

  return {
    id: `daily-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    date: new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    totalItems: items.length,
    priorityCount: priority.length,
    followUpCount: followUps.length,
    ignoreCount: ignored.length,
    bestSponsorAngle,
    bestRelationshipFollowUp: bestRelFollowUp,
    bestContentToRevenue: bestContent,
    bestOfflineMoneyPlay: bestOffline,
    whatToIgnoreToday: ignoreNote,
    founderNextMove: founderMove,
    riskWarning,
    reviewed: false,
  };
}

export function buildDailyBriefText(brief: MaxDailyBrief): string {
  return [
    `MAX DAILY MONEY BRIEF — ${brief.date.toUpperCase()}`,
    `Generated: ${new Date(brief.createdAt).toLocaleString()}`,
    ``,
    `INBOX SUMMARY`,
    `  Total items: ${brief.totalItems}`,
    `  Priority money moves: ${brief.priorityCount}`,
    `  Follow-ups needed: ${brief.followUpCount}`,
    `  Ignored / no move: ${brief.ignoreCount}`,
    ``,
    `BEST SPONSOR ANGLE TODAY`,
    brief.bestSponsorAngle,
    ``,
    `BEST RELATIONSHIP FOLLOW-UP`,
    brief.bestRelationshipFollowUp,
    ``,
    `BEST CONTENT-TO-REVENUE MOVE`,
    brief.bestContentToRevenue,
    ``,
    `BEST OFFLINE MONEY PLAY`,
    brief.bestOfflineMoneyPlay,
    ``,
    `WHAT TO IGNORE TODAY`,
    brief.whatToIgnoreToday,
    ``,
    `FOUNDER NEXT MOVE`,
    brief.founderNextMove,
    ``,
    `RISK / REPUTATION WARNING`,
    brief.riskWarning,
    ``,
    `--- TRUTH LABELS ---`,
    `Local CRO Review | Founder Review Required | No Outreach Sent | No CRM Connected | Manual Follow-Up Only`,
  ].join("\n");
}
