#!/usr/bin/env node
/**
 * Track Cursor Agent usage for this workspace only.
 *
 * Sources:
 *  1. Live events: cursor-usage/events.jsonl (written by .cursor/hooks)
 *  2. Historical: ~/.cursor/projects/<id>/agent-transcripts
 *
 * Outputs:
 *  - cursor-usage/daily.json
 *  - cursor-usage/report.csv
 *  - cursor-usage/report.xlsx (if `xlsx` is installed)
 *  - cursor-usage/meta.json
 *
 * Usage:
 *   node scripts/track-cursor-usage.mjs
 *   node scripts/track-cursor-usage.mjs --json
 *   npm run usage:track
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "cursor-usage");
const EVENTS_PATH = path.join(OUT_DIR, "events.jsonl");
const DAILY_PATH = path.join(OUT_DIR, "daily.json");
const META_PATH = path.join(OUT_DIR, "meta.json");
const CSV_PATH = path.join(OUT_DIR, "report.csv");
const XLSX_PATH = path.join(OUT_DIR, "report.xlsx");
const LEGACY_XLSX = path.join(ROOT, "cursor-usage-space-game.xlsx");

const WANT_JSON = process.argv.includes("--json");

/** Map workspace path → Cursor projects folder id. */
export function cursorProjectId(workspaceRoot = ROOT) {
  const resolved = path.resolve(workspaceRoot);
  const noColon = resolved.replace(/^([A-Za-z]):/, (_, d) => d.toLowerCase());
  return noColon.replace(/[/\\]+/g, "-").replace(/\s+/g, "-");
}

export function transcriptsDir(workspaceRoot = ROOT) {
  const id = cursorProjectId(workspaceRoot);
  return path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".cursor",
    "projects",
    id,
    "agent-transcripts",
  );
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function emptyDay(date) {
  return {
    date,
    activeChats: new Set(),
    parentChats: new Set(),
    userPrompts: 0,
    assistantSteps: 0,
    toolCalls: 0,
    subagentRuns: 0,
    transcriptBytes: 0,
    hookEvents: 0,
    hookSessions: new Set(),
    hookPrompts: 0,
    hookStops: 0,
    hookTools: 0,
    notes: [],
  };
}

function ensureDay(map, date) {
  if (!map.has(date)) map.set(date, emptyDay(date));
  return map.get(date);
}

function parseTsToDay(raw) {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    // Local calendar day (YYYY-MM-DD)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

function estimateUsd(row) {
  const intensity = row.toolCalls / Math.max(row.userPrompts, 1);
  const midPerPrompt = Math.min(0.9, Math.max(0.12, 0.08 + intensity * 0.02));
  const mid = row.userPrompts * midPerPrompt + row.subagentRuns * 0.25;
  return {
    toolsPerPrompt: Math.round(intensity * 10) / 10,
    estLowUsd: Math.round(mid * 0.45 * 100) / 100,
    estMidUsd: Math.round(mid * 100) / 100,
    estHighUsd: Math.round(mid * 2.2 * 100) / 100,
  };
}

function scanTranscripts(dayMap) {
  const base = transcriptsDir();
  if (!fs.existsSync(base)) {
    return { base, chats: 0, files: 0, missing: true };
  }

  let chats = 0;
  let files = 0;
  const entries = fs.readdirSync(base, { withFileTypes: true });

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const chatId = ent.name;
    chats++;
    const chatDir = path.join(base, chatId);
    const main = path.join(chatDir, `${chatId}.jsonl`);
    const fileList = [];
    if (fs.existsSync(main)) fileList.push({ file: main, isSub: false });
    const subDir = path.join(chatDir, "subagents");
    if (fs.existsSync(subDir)) {
      for (const s of fs.readdirSync(subDir)) {
        if (s.endsWith(".jsonl")) {
          fileList.push({ file: path.join(subDir, s), isSub: true });
        }
      }
    }

    for (const { file, isSub } of fileList) {
      files++;
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/).filter(Boolean);
      const mtimeDay = parseTsToDay(fs.statSync(file).mtime.toISOString());
      let currentDay = mtimeDay;

      for (const line of lines) {
        const tsMatch = line.match(/<timestamp>([^<]+)<\/timestamp>/);
        if (tsMatch) {
          currentDay = parseTsToDay(tsMatch[1]) || currentDay;
        }
        if (!currentDay) continue;

        const day = ensureDay(dayMap, currentDay);
        day.activeChats.add(chatId);
        day.transcriptBytes += Buffer.byteLength(line, "utf8");

        if (/"role"\s*:\s*"user"/.test(line)) {
          day.userPrompts++;
          if (isSub) day.subagentRuns++;
          else day.parentChats.add(chatId);
        }
        if (/"role"\s*:\s*"assistant"/.test(line)) day.assistantSteps++;
        const tools = line.match(/"tool_use"/g);
        if (tools) day.toolCalls += tools.length;
      }
    }
  }

  return { base, chats, files, missing: false };
}

function scanHookEvents(dayMap) {
  if (!fs.existsSync(EVENTS_PATH)) {
    return { events: 0, missing: true };
  }
  const lines = fs.readFileSync(EVENTS_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  let events = 0;
  for (const line of lines) {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    events++;
    const dayKey = parseTsToDay(ev.ts) || parseTsToDay(new Date().toISOString());
    const day = ensureDay(dayMap, dayKey);
    day.hookEvents++;
    if (ev.session_id) day.hookSessions.add(String(ev.session_id));
    switch (ev.type) {
      case "sessionStart":
        day.notes.push("session");
        break;
      case "beforeSubmitPrompt":
      case "prompt":
        day.hookPrompts++;
        // Prefer live prompt counts when hooks are active; still keep transcript counts.
        break;
      case "stop":
      case "afterAgentResponse":
        day.hookStops++;
        break;
      case "subagentStart":
        day.subagentRuns++;
        break;
      case "postToolUse":
      case "preToolUse":
        day.hookTools++;
        break;
      default:
        break;
    }
  }
  return { events, missing: false };
}

function finalizeDays(dayMap) {
  const days = [...dayMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const base = {
        date: d.date,
        activeChats: d.activeChats.size,
        parentChats: d.parentChats.size,
        userPrompts: d.userPrompts,
        assistantSteps: d.assistantSteps,
        toolCalls: d.toolCalls,
        subagentRuns: d.subagentRuns,
        transcriptKB: Math.round((d.transcriptBytes / 1024) * 10) / 10,
        hookEvents: d.hookEvents,
        hookSessions: d.hookSessions.size,
        hookPrompts: d.hookPrompts,
        hookStops: d.hookStops,
        hookTools: d.hookTools,
      };
      return { ...base, ...estimateUsd(base) };
    });

  const totals = days.reduce(
    (acc, d) => {
      acc.userPrompts += d.userPrompts;
      acc.assistantSteps += d.assistantSteps;
      acc.toolCalls += d.toolCalls;
      acc.subagentRuns += d.subagentRuns;
      acc.transcriptKB += d.transcriptKB;
      acc.hookEvents += d.hookEvents;
      acc.estLowUsd += d.estLowUsd;
      acc.estMidUsd += d.estMidUsd;
      acc.estHighUsd += d.estHighUsd;
      return acc;
    },
    {
      userPrompts: 0,
      assistantSteps: 0,
      toolCalls: 0,
      subagentRuns: 0,
      transcriptKB: 0,
      hookEvents: 0,
      estLowUsd: 0,
      estMidUsd: 0,
      estHighUsd: 0,
    },
  );
  totals.transcriptKB = Math.round(totals.transcriptKB * 10) / 10;
  totals.estLowUsd = Math.round(totals.estLowUsd * 100) / 100;
  totals.estMidUsd = Math.round(totals.estMidUsd * 100) / 100;
  totals.estHighUsd = Math.round(totals.estHighUsd * 100) / 100;
  totals.toolsPerPrompt =
    Math.round((totals.toolCalls / Math.max(totals.userPrompts, 1)) * 10) / 10;
  totals.activeDays = days.length;

  return { days, totals };
}

function writeCsv(days, totals) {
  const headers = [
    "date",
    "activeChats",
    "parentChats",
    "userPrompts",
    "assistantSteps",
    "toolCalls",
    "subagentRuns",
    "toolsPerPrompt",
    "transcriptKB",
    "hookEvents",
    "hookPrompts",
    "hookStops",
    "hookTools",
    "estLowUsd",
    "estMidUsd",
    "estHighUsd",
  ];
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = days.map((d) => headers.map((h) => escape(d[h])).join(","));
  const totalRow = headers
    .map((h) => {
      if (h === "date") return "TOTAL";
      if (h === "activeChats" || h === "parentChats") return "";
      if (h in totals) return escape(totals[h]);
      return "";
    })
    .join(",");
  fs.writeFileSync(CSV_PATH, [headers.join(","), ...rows, totalRow].join("\n"), "utf8");
}

async function writeXlsx(days, totals, meta) {
  let XLSX;
  try {
    XLSX = await import("xlsx");
  } catch {
    return { wrote: false, reason: "xlsx package not installed (CSV still written)" };
  }

  const dailyRows = days.map((d) => ({
    Date: d.date,
    "Active chats": d.activeChats,
    "Parent chats": d.parentChats,
    "User prompts": d.userPrompts,
    "Assistant steps": d.assistantSteps,
    "Tool calls": d.toolCalls,
    "Subagent runs": d.subagentRuns,
    "Tools per prompt": d.toolsPerPrompt,
    "Transcript size (KB)": d.transcriptKB,
    "Hook events": d.hookEvents,
    "Hook prompts": d.hookPrompts,
    "Hook stops": d.hookStops,
    "Hook tools": d.hookTools,
    "Est. usage low (USD)": d.estLowUsd,
    "Est. usage mid (USD)": d.estMidUsd,
    "Est. usage high (USD)": d.estHighUsd,
  }));
  dailyRows.push({
    Date: "TOTAL",
    "Active chats": "",
    "Parent chats": "",
    "User prompts": totals.userPrompts,
    "Assistant steps": totals.assistantSteps,
    "Tool calls": totals.toolCalls,
    "Subagent runs": totals.subagentRuns,
    "Tools per prompt": totals.toolsPerPrompt,
    "Transcript size (KB)": totals.transcriptKB,
    "Hook events": totals.hookEvents,
    "Hook prompts": "",
    "Hook stops": "",
    "Hook tools": "",
    "Est. usage low (USD)": totals.estLowUsd,
    "Est. usage mid (USD)": totals.estMidUsd,
    "Est. usage high (USD)": totals.estHighUsd,
  });

  const summaryRows = [
    { Field: "Project", Value: "space-game (local workspace only)" },
    { Field: "Generated at", Value: meta.generatedAt },
    { Field: "Transcripts dir", Value: meta.transcriptsDir },
    { Field: "Active Agent days", Value: totals.activeDays },
    { Field: "Total user prompts", Value: totals.userPrompts },
    { Field: "Total tool calls", Value: totals.toolCalls },
    { Field: "Total subagent runs", Value: totals.subagentRuns },
    { Field: "Hook events logged", Value: totals.hookEvents },
    { Field: "Estimated usage mid (USD)", Value: totals.estMidUsd },
    {
      Field: "Caveat",
      Value:
        "USD is a heuristic from Agent transcripts/hooks — not Cursor billing. Tab/Cmd+K not included.",
    },
    { Field: "Official usage", Value: "https://cursor.com/dashboard/usage" },
  ];

  const wb = XLSX.utils.book_new();
  const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
  XLSX.utils.book_append_sheet(wb, wsDaily, "Daily usage");
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.writeFile(wb, XLSX_PATH);
  // Keep legacy root filename for convenience
  XLSX.writeFile(wb, LEGACY_XLSX);
  return { wrote: true, paths: [XLSX_PATH, LEGACY_XLSX] };
}

async function main() {
  ensureOutDir();
  const dayMap = new Map();
  const transcriptInfo = scanTranscripts(dayMap);
  const hookInfo = scanHookEvents(dayMap);
  const { days, totals } = finalizeDays(dayMap);

  const meta = {
    generatedAt: new Date().toISOString(),
    workspaceRoot: ROOT,
    cursorProjectId: cursorProjectId(),
    transcriptsDir: transcriptInfo.base,
    transcriptChats: transcriptInfo.chats,
    transcriptFiles: transcriptInfo.files,
    transcriptsMissing: Boolean(transcriptInfo.missing),
    hookEvents: hookInfo.events ?? 0,
    hooksMissing: Boolean(hookInfo.missing),
    totals,
  };

  fs.writeFileSync(DAILY_PATH, JSON.stringify({ meta, days, totals }, null, 2), "utf8");
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), "utf8");
  writeCsv(days, totals);
  const xlsxResult = await writeXlsx(days, totals, meta);

  if (WANT_JSON) {
    console.log(JSON.stringify({ meta, days, totals, xlsxResult }, null, 2));
  } else {
    console.log(`Cursor usage tracked for ${path.basename(ROOT)}`);
    console.log(`  Active days: ${totals.activeDays}`);
    console.log(`  Prompts: ${totals.userPrompts}  Tools: ${totals.toolCalls}  Subagents: ${totals.subagentRuns}`);
    console.log(`  Est. mid USD: $${totals.estMidUsd} (band $${totals.estLowUsd}–$${totals.estHighUsd})`);
    console.log(`  Wrote: ${path.relative(ROOT, DAILY_PATH)}`);
    console.log(`  Wrote: ${path.relative(ROOT, CSV_PATH)}`);
    if (xlsxResult.wrote) {
      console.log(`  Wrote: ${path.relative(ROOT, XLSX_PATH)}`);
      console.log(`  Wrote: ${path.basename(LEGACY_XLSX)}`);
    } else {
      console.log(`  XLSX skipped: ${xlsxResult.reason}`);
      console.log(`  Tip: npm i -D xlsx   then re-run`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
