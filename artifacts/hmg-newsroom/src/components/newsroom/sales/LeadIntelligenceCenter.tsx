import { useMemo, useState } from "react";
import type { SalesLeadInput } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import {
  leadIntelligenceOpportunities,
  leadIntelligenceSections,
  leadOpportunityToPipelineInput,
  scoreLeadOpportunity,
  type LeadIntelligenceOpportunity,
  type LeadIntelligenceSection,
} from "@/components/newsroom/sales/mockMaximillionV3Data";
import { BrainCircuit, Plus, Target, Zap } from "lucide-react";

interface LeadIntelligenceCenterProps {
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
}

export function LeadIntelligenceCenter({
  onAddLead,
}: LeadIntelligenceCenterProps) {
  const [selected, setSelected] = useState<LeadIntelligenceSection | "all">(
    "all",
  );
  const [expanded, setExpanded] = useState(false);
  const leads = useMemo(
    () =>
      selected === "all"
        ? leadIntelligenceOpportunities
        : leadIntelligenceOpportunities.filter((lead) => lead.section === selected),
    [selected],
  );
  const previewLimit = selected === "all" ? 1 : 2;
  const visibleLeads = expanded ? leads : leads.slice(0, previewLimit);

  return (
    <section
      id="maximillion-lead-intelligence"
      className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <BrainCircuit className="w-4 h-4" />
            <h3 className="text-sm font-black">Lead Intelligence Center</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-3xl">
            Local mock lead discovery scored by brand fit, audience overlap,
            revenue potential, access, relationship proximity, and calendar
            relevance.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Showing {visibleLeads.length} of {leads.length}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <Button
          type="button"
          size="sm"
          variant={selected === "all" ? "default" : "outline"}
          onClick={() => setSelected("all")}
          className="h-10 min-w-10 text-[11px] shrink-0"
        >
          All
        </Button>
        {leadIntelligenceSections.map((section) => (
          <Button
            key={section.id}
            type="button"
            size="sm"
            variant={selected === section.id ? "default" : "outline"}
            onClick={() => setSelected(section.id)}
            className="h-10 text-[11px] shrink-0"
          >
            {section.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {visibleLeads.map((lead) => (
          <LeadIntelligenceCard
            key={lead.id}
            lead={lead}
            onAddLead={onAddLead}
          />
        ))}
      </div>

      {leads.length > previewLimit && (
        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setExpanded((current) => !current)}
            className="h-10 text-[11px]"
          >
            {expanded ? "Collapse lead radar" : `Show all ${leads.length} opportunities`}
          </Button>
        </div>
      )}
    </section>
  );
}

function LeadIntelligenceCard({
  lead,
  onAddLead,
}: {
  lead: LeadIntelligenceOpportunity;
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
}) {
  const score = scoreLeadOpportunity(lead);
  const factors = [
    ["Brand", lead.scoreFactors.brandFit],
    ["Audience", lead.scoreFactors.audienceOverlap],
    ["Revenue", lead.scoreFactors.revenuePotential],
    ["Access", lead.scoreFactors.easeOfAccess],
    ["Relation", lead.scoreFactors.relationshipProximity],
    ["Calendar", lead.scoreFactors.calendarRelevance],
  ];

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[13px] font-black leading-snug">
              {lead.company}
            </h4>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/[0.06] px-2 py-0.5 text-[10px] text-sky-700 dark:text-sky-100">
              {lead.category}
            </span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {lead.location} · {lead.projectedRevenueRange}
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-1.5">
          <span className="rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
            Fit {score}
          </span>
          <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-100">
            Urgency {lead.urgencyScore}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-foreground/82 line-clamp-2 sm:line-clamp-none">
        {lead.whyItMatchesHmg}
      </p>

      <div className="mt-3 hidden gap-2 md:grid md:grid-cols-3">
        <AngleBlock label="Outreach" value={lead.suggestedOutreachAngle} />
        <AngleBlock label="Content" value={lead.suggestedContentAngle} />
        <AngleBlock label="Sponsor" value={lead.suggestedSponsorAngle} />
      </div>

      <div className="mt-3 hidden grid-cols-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {factors.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-border/35 bg-secondary/25 px-2 py-1.5"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-0.5 text-[12px] font-black text-foreground">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/78 line-clamp-2 sm:line-clamp-none">
          <Zap className="w-3.5 h-3.5 text-amber-700 dark:text-amber-200 mt-0.5 shrink-0" />
          <span>{lead.followUpRecommendation}</span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onAddLead(leadOpportunityToPipelineInput(lead), lead.company)
          }
          className="h-10 w-full text-[11px] bg-emerald-500 text-white hover:bg-emerald-400 sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add to pipeline
        </Button>
      </div>
    </div>
  );
}

function AngleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/25 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-300">
        <Target className="w-3 h-3" />
        {label}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
