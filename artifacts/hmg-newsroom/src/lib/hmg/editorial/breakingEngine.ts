import { buildBrandRules } from "./brandRules.ts";
import { truncate } from "./articleEngine.ts";
import type { ParsedResearchNotes } from "./types.ts";

export interface BreakingStoryPackage {
  id: string;
  brand: string;
  brandName: string;
  headline: string;
  alertSummary: string;
  webPost: string;
  xPost: string;
  instagramCaption: string;
  pushAlert: string;
  verificationNotes: string[];
  nextActions: string[];
  createdAt: string;
}

export function generateBreakingStory(
  brand: string,
  notes: ParsedResearchNotes,
): BreakingStoryPackage {
  const rules = buildBrandRules(brand);
  const brandName = rules.profile.name;
  const subject = notes.storyTitle || notes.what || "the developing story";
  const what = notes.what || subject;

  const headline = truncate(`BREAKING: ${subject}`, 110);
  const alertSummary = truncate(
    `${brandName} is tracking ${subject}. ${notes.what ? notes.what : "Details are still being verified."}`,
    260,
  );
  const beats = notes.timeline.slice(0, 3).join("; ");
  const webPost = [
    `${rules.ledeFraming(subject)} ${what ? `Initial reporting: ${what}` : ""}`.trim(),
    beats
      ? `Confirmed beats so far: ${beats}. This post will be updated as the desk verifies more.`
      : "This post will be updated as the desk verifies more.",
    notes.whatNotToClaim.length > 0
      ? `What we are not asserting yet: ${notes.whatNotToClaim.slice(0, 2).join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const xPost = truncate(
    `🚨 BREAKING — ${subject}.\n\n${brandName} is verifying details. We post confirmed beats only. ${rules.hashtagSeed.slice(0, 2).join(" ")}`,
    280,
  );
  const instagramCaption = truncate(
    `🚨 BREAKING\n\n${subject}.\n\n${brandName} is on it. Confirmed beats only — no speculation. We update as the desk verifies more.\n\n${rules.hashtagSeed.slice(0, 3).join(" ")}`,
    2100,
  );
  const pushAlert = truncate(
    `${brandName} Breaking: ${subject} — verified update inside.`,
    180,
  );

  const verificationNotes: string[] = [
    "Breaking mode: only post confirmed beats. Update the live post as new facts are verified.",
    notes.quotes.length === 0
      ? "No quotes in source notes — do not invent statements for the alert."
      : "Quote present in source notes — verify attribution before quoting in the alert.",
    notes.sourceLinks.length === 0
      ? "No source links recorded — add at least one verifiable link before manual publish."
      : `Source links logged: ${notes.sourceLinks.length}.`,
  ];

  return {
    id: `brk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brand,
    brandName,
    headline,
    alertSummary,
    webPost,
    xPost,
    instagramCaption,
    pushAlert,
    verificationNotes,
    nextActions: [
      "Export the breaking post for the website.",
      "Copy the X / Instagram alert.",
      "Set a 30-minute update timer.",
      "When confirmed beats arrive, open Editorial Desk for the full article.",
    ],
    createdAt: new Date().toISOString(),
  };
}
