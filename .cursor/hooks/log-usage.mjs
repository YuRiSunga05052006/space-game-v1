#!/usr/bin/env node
/**
 * Cursor hook: append usage events for this workspace to cursor-usage/events.jsonl
 * Always fail-open (exit 0) so tracking never blocks the agent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "cursor-usage");
const EVENTS_PATH = path.join(OUT_DIR, "events.jsonl");

function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}

function safeJson(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { _parseError: true, raw: String(raw).slice(0, 500) };
  }
}

function appendEvent(ev) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(ev) + "\n", "utf8");
}

try {
  const raw = await readStdin();
  const input = safeJson(raw);

  const type =
    input.hook_event_name ||
    input.event_name ||
    input.event ||
    input.type ||
    process.env.CURSOR_HOOK_EVENT ||
    "unknown";

  appendEvent({
    ts: new Date().toISOString(),
    type,
    session_id: input.session_id || input.conversation_id || input.chat_id || null,
    model: input.model || input.model_name || null,
    tool: input.tool_name || input.tool || input.name || null,
    subagent_type: input.subagent_type || null,
    // Keep payload small — do not store full prompt text
    prompt_chars:
      typeof input.prompt === "string"
        ? input.prompt.length
        : typeof input.user_prompt === "string"
          ? input.user_prompt.length
          : null,
  });
} catch {
  // fail open
}

process.stdout.write("{}\n");
process.exit(0);
