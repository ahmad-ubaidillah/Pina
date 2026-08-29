#!/usr/bin/env bun
/**
 * Shrimp Kanban — lightweight visual board server.
 *
 * Combination of the best of both worlds:
 *  - VibeKanban: visual drag-drop board + agent/worktree columns, opens at localhost.
 *  - Shrimp: 6-state lifecycle (TODO→RESEARCHING→PLANNING→WORKING→EVALUATING→DONE)
 *    backed by local SQLite (board.sqlite) + mcp-shrimp-task-manager tasks.json.
 *
 * Zero external deps. Bun + bun:sqlite. No Docker, no GitHub.
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(homedir(), "Documents", "shrimp-ai");
const BOARD = join(ROOT, "board.sqlite");
const TASKDATA = join(ROOT, ".shrimp", "taskdata", "tasks.json");

const STATES = ["TODO", "RESEARCHING", "PLANNING", "WORKING", "EVALUATING", "DONE"];
// Column accent colors (shrimp brand: white/blue/black).
const COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  RESEARCHING: "#a855f7",
  PLANNING: "#f59e0b",
  WORKING: "#146ef5",
  EVALUATING: "#06b6d4",
  DONE: "#22c55e",
};

let db: Database | null = null;
if (existsSync(BOARD)) {
  // Read-write so /api/move can persist drag-drop transitions.
  // existsSync guard above means we never auto-create a fresh db.
  db = new Database(BOARD);
  // Transition history for undo (board UI).
  db.run(`CREATE TABLE IF NOT EXISTS transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    from_state TEXT,
    to_state TEXT,
    at TEXT DEFAULT (datetime('now'))
  )`);
}

function readLocal(): any[] {
  if (!db) return [];
  try {
    return db
      .query("SELECT id, title, state, desc, agent, retries, created_at, updated_at FROM tasks ORDER BY id")
      .all() as any[];
  } catch {
    return [];
  }
}

function readMcp(): any[] {
  if (!existsSync(TASKDATA)) return [];
  try {
    const data = JSON.parse(readFileSync(TASKDATA, "utf8"));
    const tasks = Array.isArray(data) ? data : data.tasks ?? [];
    // MCP uses pending|in_progress|completed|blocked — map to Shrimp 6-state lifecycle.
    const MAP: Record<string, string> = {
      pending: "TODO",
      in_progress: "WORKING",
      completed: "DONE",
      blocked: "EVALUATING",
    };
    return tasks.map((t: any) => {
      const raw = (t.status ?? t.state ?? "pending").toLowerCase();
      const deps = Array.isArray(t.dependencies)
        ? t.dependencies.map((d: any) => (typeof d === "string" ? d : d.taskId)).filter(Boolean)
        : [];
      return {
        id: "mcp-" + (t.id ?? t.taskId ?? "?"),
        title: t.name ?? t.title ?? "(untitled)",
        state: MAP[raw] ?? "TODO",
        desc: t.description ?? t.desc ?? "",
        agent: t.agent ?? "",
        retries: t.retries ?? 0,
        source: "mcp",
        deps,
      };
    });
  } catch {
    return [];
  }
}

function buildBoard() {
  const local = readLocal().map((t) => ({ ...t, source: "local" }));
  const mcp = readMcp();
  const all = [...local, ...mcp];
  const columns: Record<string, any[]> = {};
  for (const s of STATES) columns[s] = [];
  for (const t of all) {
    const st = STATES.includes(t.state) ? t.state : "TODO";
    columns[st].push(t);
  }
  return { states: STATES, colors: COLORS, columns, counts: STATES.map((s) => columns[s].length), updated: new Date().toISOString() };
}

const HTML = readFileSync(join(import.meta.dir, "index.html"), "utf8");

// Live OMNI session snapshot (best-effort; never crash the board if omni missing).
const OMNI = "/home/ahmad/Documents/shrimp-ai/shrimp-ai-core/bin/omni";
async function omniSession(): Promise<any | null> {
  if (!existsSync(OMNI)) return null;
  try {
    const p = Bun.spawn([OMNI, "session", "--status", "--json"], {
      stdout: "pipe", stderr: "ignore",
    });
    const txt = await new Response(p.stdout).text();
    await p.exited;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function omniStats(): Promise<any | null> {
  if (!existsSync(OMNI)) return null;
  try {
    const p = Bun.spawn([OMNI, "stats", "--json"], { stdout: "pipe", stderr: "ignore" });
    const txt = await new Response(p.stdout).text();
    await p.exited;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

const server = Bun.serve({
  port: 8787,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/board") {
      return new Response(JSON.stringify(buildBoard()), {
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }
    if (url.pathname === "/api/agent") {
      const [sess, stats] = await Promise.all([omniSession(), omniStats()]);
      return new Response(JSON.stringify({ session: sess, stats, ok: !!(sess || stats) }), {
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }
    if (url.pathname === "/api/move" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { id, state } = body;
      if (db && typeof id === "number" && STATES.includes(state)) {
        const cur = db.query("SELECT state FROM tasks WHERE id = ?").get(id) as any;
        const from = cur?.state ?? "TODO";
        db.run("UPDATE tasks SET state = ?, updated_at = datetime('now') WHERE id = ?", [state, id]);
        db.run("INSERT INTO transitions (task_id, from_state, to_state) VALUES (?, ?, ?)", [id, from, state]);
        return new Response(JSON.stringify({ ok: true }));
      }
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
    if (url.pathname === "/api/undo" && req.method === "POST") {
      if (db) {
        const last = db.query("SELECT id, task_id, from_state FROM transitions ORDER BY id DESC LIMIT 1").get() as any;
        if (last) {
          db.run("UPDATE tasks SET state = ? WHERE id = ?", [last.from_state, last.task_id]);
          db.run("DELETE FROM transitions WHERE id = ?", [last.id]);
          return new Response(JSON.stringify({ ok: true, task_id: last.task_id, state: last.from_state }));
        }
      }
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
    if (url.pathname === "/api/launch" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const prompt = String(body.prompt ?? "").slice(0, 2000);
      if (!prompt) return new Response(JSON.stringify({ ok: false, error: "empty prompt" }), { status: 400 });
      // Launch shrimp -p in its own session (detached). No GitHub, local-only.
      const child = Bun.spawn(
        ["/home/ahmad/Documents/shrimp-ai/shrimp-ai-core/packages/coding-agent/dist/shrimp", "-p", prompt],
        { stdout: "ignore", stderr: "ignore", stdin: "ignore", env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.HOME}/.local/bin:${process.env.PATH}` } }
      );
      return new Response(JSON.stringify({ ok: true, pid: child.pid }));
    }
    if (url.pathname === "/api/spawn" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const prompt = String(body.prompt ?? "").slice(0, 2000);
      if (!prompt) return new Response(JSON.stringify({ ok: false, error: "empty prompt" }), { status: 400 });
      // Spawn a swarm worker via the shrimp-swarm plugin's spawn_worker tool.
      const child = Bun.spawn(
        ["/home/ahmad/Documents/shrimp-ai/shrimp-ai-core/packages/coding-agent/dist/shrimp",
         "-p", `use the spawn_worker tool: ${prompt}`],
        { stdout: "ignore", stderr: "ignore", stdin: "ignore", env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.HOME}/.local/bin:${process.env.PATH}` } }
      );
      return new Response(JSON.stringify({ ok: true, pid: child.pid }));
    }
    if (url.pathname === "/api/swarm-state" && req.method === "GET") {
      // Read the persistent swarm state file written by @quintinshaw/swarm.
      const SP = join(homedir(), ".shrimp", "swarm-state.json");
      try {
        const s = existsSync(SP) ? JSON.parse(readFileSync(SP, "utf8")) : {};
        return new Response(JSON.stringify({ ok: true, state: {
          goal: s.goal ?? null,
          autonomous: s.autonomous ?? false,
          budgetTurns: s.budgetTurns ?? 0,
          refinements: (s.refinements ?? []).length,
        }}), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
      } catch {
        return new Response(JSON.stringify({ ok: false }), { status: 500 });
      }
    }
    if (url.pathname === "/api/swarm" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const action = String(body.action ?? body.command ?? "").slice(0, 50);
      const arg = String(body.arg ?? body.text ?? "").slice(0, 2000);
      // Map UI actions to the shrimp-swarm plugin tools (set_goal / set_autonomous / refine).
      let cmd = "";
      if (action === "goal") {
        cmd = `Call set_goal with text '${arg.replace(/'/g, "")}'.`;
      } else if (action === "autonomous") {
        const mode = arg === "off" ? "off" : "on";
        const budget = Number(body.budget ?? 0);
        cmd = `Call set_autonomous with mode '${mode}'${budget > 0 ? ` and budget ${budget}` : ""}.`;
      } else if (action === "refine") {
        cmd = `Call refine.`;
      } else {
        cmd = String(body.command ?? "").slice(0, 200);
      }
      if (!cmd) return new Response(JSON.stringify({ ok: false, error: "empty command" }), { status: 400 });
      const child = Bun.spawn(
        ["/home/ahmad/Documents/shrimp-ai/shrimp-ai-core/packages/coding-agent/dist/shrimp", "-p", cmd],
        { stdout: "ignore", stderr: "ignore", stdin: "ignore", env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.HOME}/.local/bin:${process.env.PATH}` } }
      );
      return new Response(JSON.stringify({ ok: true, pid: child.pid }));
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`🦐 Shrimp Kanban board → http://127.0.0.1:${server.port}`);
