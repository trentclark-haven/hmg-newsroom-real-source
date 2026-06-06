/**
 * HMG Memory Importers — lightweight, no heavy deps.
 * TXT/MD: raw text capture, title from first line or filename.
 * JSON: validate + preview before saving.
 * CSV: contact-style parser → route to Max / Relationship Graph.
 */

import type { MemoryItem, MemoryType } from "./types";
import { MEMORY_SCHEMA_VERSION } from "./types";

export interface ImportResult {
  ok: true;
  items: Partial<MemoryItem>[];
  preview: string;
  count: number;
  format: "txt" | "md" | "json" | "csv";
}

export interface ImportError {
  ok: false;
  error: string;
}

export type ImportOutcome = ImportResult | ImportError;

function inferTitleFromText(text: string, fallback: string): string {
  const firstLine = text.split(/\r?\n/)[0]?.trim() ?? "";
  const cleaned = firstLine.replace(/^#\s*/, "").trim();
  if (cleaned.length >= 4 && cleaned.length <= 160) return cleaned;
  return fallback;
}

/**
 * TXT / Markdown importer.
 */
export function importText(
  content: string,
  filename: string,
  memoryType: MemoryType,
): ImportOutcome {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "File is empty." };
  const title = inferTitleFromText(trimmed, filename.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled");
  const preview = trimmed.length > 300 ? trimmed.slice(0, 297) + "…" : trimmed;
  return {
    ok: true,
    items: [{ title, content: trimmed, type: memoryType, preview }],
    preview,
    count: 1,
    format: filename.endsWith(".md") || filename.endsWith(".markdown") ? "md" : "txt",
  };
}

/**
 * JSON importer — supports:
 *   - Single MemoryItem object
 *   - Array of MemoryItem objects
 *   - Full export payload ({ schemaVersion, items: [] })
 */
export function importJSON(raw: string): ImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON — could not parse." };
  }

  // Full export payload
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    (parsed as Record<string, unknown>).schemaVersion === MEMORY_SCHEMA_VERSION
  ) {
    const payload = parsed as Record<string, unknown>;
    const items = Array.isArray(payload.items) ? (payload.items as Partial<MemoryItem>[]) : [];
    if (items.length === 0) return { ok: false, error: "JSON export payload has no items." };
    return {
      ok: true,
      items,
      preview: `Import of ${items.length} memory item(s) from HMG export.`,
      count: items.length,
      format: "json",
    };
  }

  // Array of items
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return { ok: false, error: "JSON array is empty." };
    return {
      ok: true,
      items: parsed as Partial<MemoryItem>[],
      preview: `Import of ${parsed.length} item(s) from JSON array.`,
      count: parsed.length,
      format: "json",
    };
  }

  // Single item
  if (parsed && typeof parsed === "object") {
    return {
      ok: true,
      items: [parsed as Partial<MemoryItem>],
      preview: "Import of 1 item from JSON object.",
      count: 1,
      format: "json",
    };
  }

  return { ok: false, error: "Unrecognized JSON shape. Expected an array or object." };
}

/**
 * Contact-style CSV parser.
 * Columns: name, email, company, role, notes, tags (in any order, header row required).
 * Produces items pre-typed as "contact-csv" → routes to Max / Relationship Graph.
 */
export interface CsvContact {
  name: string;
  email: string;
  company: string;
  role: string;
  notes: string;
  tags: string[];
}

export interface CsvImportResult {
  ok: true;
  contacts: CsvContact[];
  items: Partial<MemoryItem>[];
  preview: string;
  count: number;
  format: "csv";
}

export type CsvImportOutcome = CsvImportResult | ImportError;

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function importCSV(raw: string): CsvImportOutcome {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false, error: "CSV must have a header row and at least one data row." };

  const header = parseCsvRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const idx = header.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nameCol = colIdx(["name", "fullname", "full_name"]);
  const emailCol = colIdx(["email", "emailaddress"]);
  const companyCol = colIdx(["company", "organization", "org"]);
  const roleCol = colIdx(["role", "title", "jobtitle"]);
  const notesCol = colIdx(["notes", "note", "comments"]);
  const tagsCol = colIdx(["tags", "tag", "keywords"]);

  const contacts: CsvContact[] = [];
  const items: Partial<MemoryItem>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const row = parseCsvRow(lines[r]);
    const get = (idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");
    const name = get(nameCol) || `Contact ${r}`;
    const email = get(emailCol);
    const company = get(companyCol);
    const role = get(roleCol);
    const notes = get(notesCol);
    const tagsRaw = get(tagsCol);
    const tags = tagsRaw ? tagsRaw.split(/[;|]/).map((t) => t.trim()).filter(Boolean) : [];

    const contact: CsvContact = { name, email, company, role, notes, tags };
    contacts.push(contact);

    const content = [
      `Name: ${name}`,
      email ? `Email: ${email}` : null,
      company ? `Company: ${company}` : null,
      role ? `Role: ${role}` : null,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    items.push({
      title: name,
      type: "contact-csv",
      content,
      tags: email ? [email, ...tags] : tags,
      notes: notes || "",
      source: "CSV import",
    });
  }

  if (contacts.length === 0) return { ok: false, error: "No valid rows found in CSV." };

  return {
    ok: true,
    contacts,
    items,
    preview: `${contacts.length} contact(s) parsed. First: ${contacts[0].name}${contacts[0].company ? ` — ${contacts[0].company}` : ""}.`,
    count: contacts.length,
    format: "csv",
  };
}

/**
 * Read a File object and dispatch to the correct importer.
 */
export async function importFile(
  file: File,
  memoryType: MemoryType,
): Promise<ImportOutcome | CsvImportOutcome> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "File is over 8 MB — paste the text directly instead." };
  }

  const text = await file.text();

  if (ext === "csv") return importCSV(text);
  if (ext === "json") return importJSON(text);
  return importText(text, file.name, memoryType);
}
