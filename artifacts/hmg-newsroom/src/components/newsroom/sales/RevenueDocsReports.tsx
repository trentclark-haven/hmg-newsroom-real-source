import { useMemo, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  chartMockCards,
  documentTypeOptions,
  mockReportOutputs,
  reportTypeOptions,
} from "@/components/newsroom/sales/mockMaximillionData";
import { documentArchitectureNodes } from "@/components/newsroom/sales/mockMaximillionV3Data";
import {
  BarChart3,
  FileText,
  Mail,
  PhoneCall,
  Presentation,
  ReceiptText,
  Send,
  TableProperties,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

export function RevenueDocsReports() {
  const [documentType, setDocumentType] = useState(documentTypeOptions[0].id);
  const [reportType, setReportType] = useState(reportTypeOptions[0].id);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("Created local mock report");

  const selectedReport = useMemo(
    () =>
      mockReportOutputs.find((report) => report.reportType === reportType) ??
      mockReportOutputs[0],
    [reportType],
  );

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const names = Array.from(event.dataTransfer.files).map((file) => file.name);
    if (names.length) {
      setFileNames(names);
      setLastAction("Files noted locally. Parsing is intentionally inactive.");
    }
  }

  function setReport(nextReportType: string, action: string) {
    setReportType(nextReportType);
    setLastAction(action);
  }

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-black">Revenue Docs & Reports</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-3xl">
            Local placeholder for future document reasoning across sales docs,
            expenses, sponsorship lists, rate cards, CSVs, spreadsheets, charts,
            deck notes, call notes, and email drafts.
          </p>
        </div>
        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-100">
          UI only · no parsing · no AI calls
        </span>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
        <div className="space-y-3">
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="block rounded-lg border border-dashed border-emerald-300/30 bg-emerald-400/[0.04] p-4 text-center cursor-pointer hover:bg-emerald-400/[0.07] transition-colors"
          >
            <UploadCloud className="w-8 h-8 mx-auto text-emerald-700 dark:text-emerald-200" />
            <div className="mt-2 text-[12px] font-black text-foreground">
              Upload or drop documents
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Files are only named in local UI for now. No contents are parsed.
            </p>
            <input
              type="file"
              accept=".csv,.pdf,.xlsx,.xls,.txt"
              multiple
              className="sr-only"
              onChange={(event) => {
                const names = Array.from(event.target.files ?? []).map(
                  (file) => file.name,
                );
                setFileNames(names);
                if (names.length) {
                  setLastAction(
                    "Files noted locally. Parsing is intentionally inactive.",
                  );
                }
              }}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Field label="Document type">
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
              >
                {documentTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Report type">
              <select
                value={reportType}
                onChange={(event) => {
                  setReportType(event.target.value);
                  setLastAction("Created local mock report");
                }}
                className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
              >
                {reportTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Local file queue
            </div>
            <div className="mt-2 space-y-1.5">
              {fileNames.length ? (
                fileNames.map((name) => (
                  <div
                    key={name}
                    className="rounded-md bg-secondary/30 border border-border/35 px-2 py-1.5 text-[11px] text-foreground/82 truncate"
                  >
                    {name}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No files selected. Mock reports still work from local sample
                  data.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ActionButton
              icon={PhoneCall}
              label="Sales call prep"
              onClick={() =>
                setReport("sales-call-brief", "Sales call prep mock generated")
              }
            />
            <ActionButton
              icon={Mail}
              label="Email/deck summary"
              onClick={() =>
                setReport(
                  "sponsor-pitch-summary",
                  "Email and deck summary mock generated",
                )
              }
            />
            <ActionButton
              icon={ReceiptText}
              label="Expense breakdown"
              onClick={() =>
                setReport(
                  "expense-breakdown",
                  "Expense breakdown mock generated",
                )
              }
            />
            <ActionButton
              icon={Presentation}
              label="Chart pack"
              onClick={() =>
                setReport(
                  "presentation-chart-pack",
                  "Presentation chart pack mock generated",
                )
              }
            />
          </div>

          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">
                  Mock generated report
                </div>
                <h4 className="mt-1 text-sm font-black">
                  {selectedReport.title}
                </h4>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {lastAction}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground/84">
              {selectedReport.summary}
            </p>
            <div className="mt-3 space-y-2">
              {selectedReport.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground/80"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            {selectedReport.table && <MockTable rows={selectedReport.table} />}
          </div>

          <div className="rounded-lg border border-sky-300/20 bg-sky-400/[0.04] p-3">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
              <BarChart3 className="w-4 h-4" />
              <h4 className="text-sm font-black">Chart / Presentation Mocks</h4>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {chartMockCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-lg border border-border/45 bg-secondary/30 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-black leading-snug">
                        {card.title}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                    <TableProperties className="w-3.5 h-3.5 text-sky-700 dark:text-sky-200 shrink-0" />
                  </div>
                  <div className="mt-2 grid gap-1.5">
                    {card.dataPoints.map((point) => (
                      <div
                        key={`${card.id}-${point.label}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/35 bg-secondary/25 px-2 py-1 text-[10px]"
                      >
                        <span className="text-muted-foreground">
                          {point.label}
                        </span>
                        <span className="font-black text-sky-700 dark:text-sky-100">
                          {point.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="mt-2 h-8 w-full text-[11px] opacity-70"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {card.deckAction}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.04] p-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
              <FileText className="w-4 h-4" />
              <h4 className="text-sm font-black">
                Document + Artifact Architecture
              </h4>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Future document contracts are visible now. Outputs remain mock
              only until a safe local parser or provider adapter is connected.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {documentArchitectureNodes.map((node) => (
                <div
                  key={node.id}
                  className="rounded-lg border border-border/45 bg-secondary/30 p-2.5"
                >
                  <div className="text-[12px] font-black text-foreground">
                    {node.title}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-emerald-300">
                    Accepts {node.accepts.join(", ")}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-foreground/80">
                    {node.mockOutput}
                  </p>
                  <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                    Future: {node.futureHook}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-9 justify-start text-[11px]"
    >
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </Button>
  );
}

function MockTable({ rows }: { rows: Array<Record<string, string>> }) {
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border/45">
      <table className="w-full min-w-[420px] text-left text-[11px]">
        <thead className="bg-secondary/45 text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-2 py-2 font-black uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/35">
          {rows.map((row, index) => (
            <tr key={index}>
              {headers.map((header) => (
                <td key={header} className="px-2 py-2 text-foreground/80">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
