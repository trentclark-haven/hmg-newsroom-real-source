import { useState } from "react";
import { useUsageStats } from "@/lib/useUsageStats";
import { useSponsors } from "@/lib/sponsors";
import { useSalesPipeline } from "@/lib/sales";
import { useAssignments } from "@/lib/assignments";
import { useAuditLog } from "@/lib/auditLog";
import {
  buildWeeklyReport,
  downloadReport,
  reportToMarkdown,
} from "@/lib/weeklyReport";
import { Button } from "@/components/ui/button";
import { FileBarChart2, Download } from "lucide-react";
import { toast } from "sonner";

export function WeeklyReportCard() {
  const { events } = useUsageStats();
  const { sponsors } = useSponsors();
  const { leads } = useSalesPipeline();
  const { assignments } = useAssignments();
  const { entries: audit } = useAuditLog();
  const [previewOpen, setPreviewOpen] = useState(false);

  const report = buildWeeklyReport({
    events,
    audit,
    sponsors,
    sales: leads,
    assignments,
  });

  function handleDownload() {
    try {
      downloadReport(report);
      toast.success("Weekly report downloaded (JSON + Markdown)");
    } catch {
      toast.error("Report download failed");
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <FileBarChart2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Weekly Report
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            data-testid="weekly-report-preview-btn"
            className="h-8 text-[11px]"
          >
            {previewOpen ? "Hide preview" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            data-testid="weekly-report-download-btn"
            className="h-8 text-[11px]"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <Stat label="Created" value={report.totals.articlesGenerated} />
        <Stat label="Drafts" value={report.totals.drafts} />
        <Stat label="Manual" value={report.totals.publishes} />
        <Stat label="Images" value={report.totals.imagesGenerated} />
        <Stat label="Clips" value={report.totals.clipsPackaged} />
        <Stat label="Sponsors" value={report.totals.sponsorsActive} />
        <Stat label="New leads" value={report.totals.salesLeadsAdded} />
        <Stat label="Tasks done" value={report.totals.tasksCompleted} />
      </div>

      {previewOpen && (
        <pre
          data-testid="weekly-report-preview"
          className="mt-3 max-h-[280px] overflow-y-auto text-[10px] leading-snug whitespace-pre-wrap text-foreground/80 bg-secondary/40 border border-border/40 rounded p-2"
        >
          {reportToMarkdown(report)}
        </pre>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-1.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
