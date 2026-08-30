#!/usr/bin/env bun
/**
 * Pina Board — lightweight visual board + hub server.
 *
 * Per-project: chat, kanban (saved to SQLite, scoped per project), git-tree history
 * with safe restore (new branch from a commit), and web-editable settings
 * (heartbeat / cron / gateway — wired in Phase 2).
 *
 * Zero external deps. Bun + bun:sqlite. No Docker, no GitHub.
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(homedir(), "Documents", "pina");
const PINA = join(homedir(), ".pina");
const BOARD = join(PINA, "board.sqlite");
const PROJECTS_FILE = join(PINA, "projects.json");
const SETTINGS_FILE = join(PINA, "settings.json");
const TASKDATA = join(PINA, "taskdata", "tasks.json");
const BIN = join(ROOT, "pina-core", "packages", "coding-agent", "dist", "shrimp");
const OMNI = join(ROOT, "pina-core", "bin", "omni");

mkdirSync(PINA, { recursive: true });

const STATES = ["TODO", "RESEARCHING", "PLANNING", "WORKING", "EVALUATING", "DONE"];
const COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  RESEARCHING: "#a855f7",
  PLANNING: "#f59e0b",
  WORKING: "#146ef5",
  EVALUATING: "#06b6d4",
  DONE: "#22c55e",
};

// --- DB (always open; per-project via project_id) ---
const db = new Database(BOARD);
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  state TEXT DEFAULT 'TODO',
  desc TEXT DEFAULT '',
  agent TEXT DEFAULT '',
  retries INTEGER DEFAULT 0,
  project_id TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);
db.run(`CREATE TABLE IF NOT EXISTS transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  from_state TEXT,
  to_state TEXT,
  at TEXT DEFAULT (datetime('now'))
)`);

// --- helpers: projects / settings ---
function loadProjects(): any[] {
  try {
    if (!existsSync(PROJECTS_FILE)) return [];
    const d = JSON.parse(readFileSync(PROJECTS_FILE, "utf8"));
    return Array.isArray(d) ? d : d.projects ?? [];
  } catch {
    return [];
  }
}
function saveProjects(p: any[]) {
  writeFileSync(PROJECTS_FILE, JSON.stringify(p, null, 2));
}
function loadSettings(): any {
  try {
    if (!existsSync(SETTINGS_FILE)) return { heartbeat: { enabled: false, intervalSec: 30 }, cron: [], gateway: { telegram: { enabled: false, token: "", chatId: "" } } };
    return JSON.parse(readFileSync(SETTINGS_FILE, "utf8"));
  } catch {
    return { heartbeat: { enabled: false, intervalSec: 30 }, cron: [], gateway: { telegram: { enabled: false, token: "", chatId: "" } } };
  }
}
function saveSettings(s: any) {
  writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}
function getProjectPath(id: string): string | null {
  const p = loadProjects().find((x) => x.id === id);
  return p && existsSync(p.path) ? p.path : null;
}

// --- board (per project) ---
function readLocal(projectId: string): any[] {
  try {
    return db
      .query("SELECT id, title, state, desc, agent, retries, project_id FROM tasks WHERE project_id = ? ORDER BY id")
      .all(projectId) as any[];
  } catch {
    return [];
  }
}
function readMcp(projectId: string): any[] {
  if (projectId !== "default" || !existsSync(TASKDATA)) return [];
  try {
    const data = JSON.parse(readFileSync(TASKDATA, "utf8"));
    const tasks = Array.isArray(data) ? data : data.tasks ?? [];
    const MAP: Record<string, string> = { pending: "TODO", in_progress: "WORKING", completed: "DONE", blocked: "EVALUATING" };
    return tasks.map((t: any) => {
      const raw = (t.status ?? t.state ?? "pending").toLowerCase();
      const deps = Array.isArray(t.dependencies) ? t.dependencies.map((d: any) => (typeof d === "string" ? d : d.taskId)).filter(Boolean) : [];
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
function buildBoard(projectId: string) {
  const local = readLocal(projectId).map((t) => ({ ...t, source: "local" }));
  const mcp = readMcp(projectId);
  const all = [...local, ...mcp];
  const columns: Record<string, any[]> = {};
  for (const s of STATES) columns[s] = [];
  for (const t of all) {
    const st = STATES.includes(t.state) ? t.state : "TODO";
    columns[st].push(t);
  }
  return { states: STATES, colors: COLORS, columns, counts: STATES.map((s) => columns[s].length), updated: new Date().toISOString(), project: projectId };
}

const HTML = readFileSync(join(import.meta.dir, "index.html"), "utf8");

// Live OMNI snapshot (best-effort).
async function omni(args: string[]): Promise<any | null> {
  if (!existsSync(OMNI)) return null;
  try {
    const p = Bun.spawn([OMNI, ...args, "--json"], { stdout: "pipe", stderr: "ignore" });
    const txt = await new Response(p.stdout).text();
    await p.exited;
    try { return JSON.parse(txt); } catch { return txt; }
  } catch {
    return null;
  }
}

// git helpers
async function gitLogAsync(path: string, all = true): Promise<{ commits: any[]; text: string }> {
  if (!existsSync(join(path, ".git"))) return { commits: [], text: "(bukan git repo)" };
  try {
    const p = Bun.spawn(["git", "-C", path, "log", "--graph", "--oneline", "--decorate", all ? "--all" : "", "-n", "60"], { stdout: "pipe", stderr: "ignore" });
    const text = await new Response(p.stdout).text();
    await p.exited;
    const commits = text
      .split("\n")
      .map((line) => {
        const m = line.match(/([0-9a-f]{7,40})\s+(.*)$/);
        if (!m) return null;
        return { hash: m[1], msg: m[2].replace(/\s*\(.*\)$/, ""), graph: line.split(m[1])[0].trim() };
      })
      .filter(Boolean) as any[];
    return { commits, text };
  } catch {
    return { commits: [], text: "" };
  }
}
async function gitRestore(path: string, commit: string): Promise<{ ok: boolean; branch?: string; error?: string }> {
  if (!existsSync(join(path, ".git"))) return { ok: false, error: "bukan git repo" };
  const branch = `pina-restore-${commit.slice(0, 8)}`;
  try {
    const p = Bun.spawn(["git", "-C", path, "branch", branch, commit], { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(p.stdout).text();
    const err = await new Response((p.stderr as any)).text();
    await p.exited;
    if (err) return { ok: false, error: err };
    return { ok: true, branch };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

const env = () => ({ ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.HOME}/.local/bin:${process.env.PATH}` });

// Capture full stdout of a pina -p run (used by heartbeat / cron / telegram).
async function spawnCapture(args: string[], cwd?: string): Promise<string> {
  try {
    const p = Bun.spawn([BIN, ...args], { stdout: "pipe", stderr: "pipe", stdin: "ignore", cwd, env: env() });
    const text = (await new Response(p.stdout).text()) + (await new Response((p.stderr as any)).text());
    await p.exited;
    return text;
  } catch (e: any) {
    return "[spawn error: " + (e?.message ?? e) + "]";
  }
}

function cronMatches(expr: string, d: Date): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [m, h, dom, mon, dow] = parts;
  const match = (v: string, cur: number) => v === "*" || v.split(",").map(Number).includes(cur);
  return match(m, d.getMinutes()) && match(h, d.getHours()) && match(dom, d.getDate()) && match(mon, d.getMonth() + 1) && match(dow, d.getDay());
}

// --- autonomous loops (read settings fresh each tick) ---
let hbRunning = false;
async function heartbeatTick() {
  const s = loadSettings();
  if (!s.heartbeat?.enabled || hbRunning) return;
  hbRunning = true;
  try {
    let goal = "";
    try { goal = JSON.parse(readFileSync(join(PINA, "swarm-state.json"), "utf8")).goal || ""; } catch {}
    const prompt = goal
      ? `Continue the persistent goal: ${goal}. Do ONE small, safe, verifiable step, then stop.`
      : `Do ONE small, safe, verifiable improvement to the codebase, then stop.`;
    await spawnCapture(["-p", prompt]);
  } finally { hbRunning = false; }
}

let cronLast = 0;
async function cronTick() {
  const s = loadSettings();
  const jobs = Array.isArray(s.cron) ? s.cron : [];
  const now = Date.now();
  if (now - cronLast < 55000) return; // at most once per minute
  cronLast = now;
  const d = new Date();
  for (const j of jobs) {
    if (j.at && cronMatches(j.at, d)) {
      const prompt = j.action === "goal"
        ? `Call set_goal with text '${String(j.arg ?? "").replace(/'/g, "")}'.`
        : String(j.arg ?? j.action ?? "");
      if (prompt) await spawnCapture(["-p", prompt]);
    }
  }
}

let tgOffset = 0;
let tgRunning = false;
async function tgPoll() {
  const s = loadSettings();
  const tg = s.gateway?.telegram;
  if (!tg?.enabled || !tg.token || tgRunning) return;
  tgRunning = true;
  try {
    const u = `https://api.telegram.org/bot${tg.token}/getUpdates?offset=${tgOffset}&timeout=15`;
    const r = await fetch(u);
    const j = await r.json().catch(() => ({}) as any);
    if (j.ok && Array.isArray(j.result)) {
      for (const upd of j.result) {
        tgOffset = upd.update_id + 1;
        const msg: string | undefined = upd.message?.text;
        const chatId: string | number | undefined = upd.message?.chat?.id ?? tg.chatId;
        if (msg && chatId) {
          const out = await spawnCapture(["-p", msg]);
          await fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: out.slice(0, 4000) }),
          }).catch(() => {});
          // best-effort photo: agent may emit MEDIA:/path or an absolute image path
          const m = out.match(/MEDIA:\s*(\S+\.(png|jpe?g|webp))|(\/\S+\.(png|jpe?g|webp))/i);
          const fp = m?.[1] ?? m?.[3];
          if (fp && existsSync(fp)) {
            await fetch(`https://api.telegram.org/bot${tg.token}/sendPhoto`, {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, photo: fp }),
            }).catch(() => {});
          }
        }
      }
    }
  } catch { /* offline — skip */ } finally { tgRunning = false; }
}

// Run loops (safe no-ops until enabled in settings).
setInterval(heartbeatTick, 5000);
setInterval(cronTick, 30000);
setInterval(tgPoll, 5000);

const server = Bun.serve({
  port: 8787,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);

    // --- projects ---
    if (url.pathname === "/api/projects" && req.method === "GET") {
      return json(loadProjects());
    }
    if (url.pathname === "/api/projects" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const name = String(b.name ?? "").trim();
      const path = String(b.path ?? "").trim();
      if (!name || !path) return json({ ok: false, error: "name & path required" }, 400);
      if (!existsSync(path)) return json({ ok: false, error: "path tidak ditemukan" }, 400);
      const list = loadProjects();
      const id = "p" + Date.now().toString(36);
      list.push({ id, name, path });
      saveProjects(list);
      return json({ ok: true, id, name, path });
    }
    if (url.pathname.startsWith("/api/projects/") && req.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      const list = loadProjects().filter((p) => p.id !== id);
      saveProjects(list);
      return json({ ok: true });
    }
    if (url.pathname.endsWith("/gitlog") && req.method === "GET") {
      const id = url.pathname.split("/")[3];
      const path = getProjectPath(id);
      if (!path) return json({ ok: false, error: "project path invalid" }, 400);
      const r = await gitLogAsync(path, url.searchParams.get("all") !== "0");
      return json({ ok: true, ...r });
    }
    if (url.pathname.endsWith("/restore") && req.method === "POST") {
      const id = url.pathname.split("/")[3];
      const path = getProjectPath(id);
      const b = await req.json().catch(() => ({}));
      const commit = String(b.commit ?? "").trim();
      if (!path) return json({ ok: false, error: "project path invalid" }, 400);
      if (!commit) return json({ ok: false, error: "commit required" }, 400);
      const r = await gitRestore(path, commit);
      return json(r, r.ok ? 200 : 400);
    }

    // --- board (per project) ---
    if (url.pathname === "/api/board" && req.method === "GET") {
      const project = url.searchParams.get("project") || "default";
      return json(buildBoard(project));
    }
    if (url.pathname === "/api/move" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const { id, state, project } = b;
      if (typeof id === "number" && STATES.includes(state)) {
        const cur = db.query("SELECT state FROM tasks WHERE id = ?").get(id) as any;
        const from = cur?.state ?? "TODO";
        db.run("UPDATE tasks SET state = ?, updated_at = datetime('now') WHERE id = ?", [state, id]);
        db.run("INSERT INTO transitions (task_id, from_state, to_state) VALUES (?, ?, ?)", [id, from, state]);
        return json({ ok: true });
      }
      return json({ ok: false }, 400);
    }
    if (url.pathname === "/api/add" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const title = String(b.title ?? "").slice(0, 500).trim();
      const project = String(b.project ?? "default");
      if (!title) return json({ ok: false, error: "title required" }, 400);
      db.run(
        "INSERT INTO tasks (title, state, project_id) VALUES (?, 'TODO', ?)",
        [title, project]
      );
      return json({ ok: true });
    }
    if (url.pathname === "/api/undo" && req.method === "POST") {
      const last = db.query("SELECT id, task_id, from_state FROM transitions ORDER BY id DESC LIMIT 1").get() as any;
      if (last) {
        db.run("UPDATE tasks SET state = ? WHERE id = ?", [last.from_state, last.task_id]);
        db.run("DELETE FROM transitions WHERE id = ?", [last.id]);
        return json({ ok: true, task_id: last.task_id, state: last.from_state });
      }
      return json({ ok: false }, 400);
    }

    // --- agent / swarm ---
    if (url.pathname === "/api/agent" && req.method === "GET") {
      const [sess, stats] = await Promise.all([omni(["session", "--status"]), omni(["stats"])]);
      return json({ session: sess, stats, ok: !!(sess || stats) });
    }
    if (url.pathname === "/api/swarm-state" && req.method === "GET") {
      const SP = join(PINA, "swarm-state.json");
      try {
        const s = existsSync(SP) ? JSON.parse(readFileSync(SP, "utf8")) : {};
        return json({ ok: true, state: { goal: s.goal ?? null, autonomous: s.autonomous ?? false, budgetTurns: s.budgetTurns ?? 0, refinements: (s.refinements ?? []).length } });
      } catch {
        return json({ ok: false }, 500);
      }
    }
    if (url.pathname === "/api/swarm" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const action = String(b.action ?? "").slice(0, 50);
      const arg = String(b.arg ?? "").slice(0, 2000);
      let cmd = "";
      if (action === "goal") cmd = `Call set_goal with text '${arg.replace(/'/g, "")}'.`;
      else if (action === "autonomous") {
        const mode = arg === "off" ? "off" : "on";
        const budget = Number(b.budget ?? 0);
        cmd = `Call set_autonomous with mode '${mode}'${budget > 0 ? ` and budget ${budget}` : ""}.`;
      } else if (action === "refine") cmd = `Call refine.`;
      if (!cmd) return json({ ok: false, error: "empty command" }, 400);
      const cwd = getProjectPath(b.project) || undefined;
      Bun.spawn([BIN, "-p", cmd], { stdout: "ignore", stderr: "ignore", stdin: "ignore", cwd, env: env() });
      return json({ ok: true });
    }

    // --- launch / spawn / chat (cwd-scoped to project) ---
    const bodyCwd = async (b: any) => getProjectPath(b.project) || undefined;

    if (url.pathname === "/api/launch" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const prompt = String(b.prompt ?? "").slice(0, 2000);
      if (!prompt) return json({ ok: false, error: "empty prompt" }, 400);
      const cwd = await bodyCwd(b);
      const child = Bun.spawn([BIN, "-p", prompt], { stdout: "ignore", stderr: "ignore", stdin: "ignore", cwd, env: env() });
      return json({ ok: true, pid: child.pid });
    }
    if (url.pathname === "/api/spawn" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const prompt = String(b.prompt ?? "").slice(0, 2000);
      if (!prompt) return json({ ok: false, error: "empty prompt" }, 400);
      const role = b.role ? ` with role '${String(b.role).slice(0, 20)}'` : "";
      const cwd = await bodyCwd(b);
      const child = Bun.spawn([BIN, "-p", `use the spawn_worker tool${role}: ${prompt}`], { stdout: "ignore", stderr: "ignore", stdin: "ignore", cwd, env: env() });
      return json({ ok: true, pid: child.pid });
    }
    if (url.pathname === "/api/chat" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const message = String(b.message ?? "").slice(0, 4000);
      if (!message) return json({ ok: false, error: "empty message" }, 400);
      const model = String(b.model ?? "sumopod/mimo-v2.5").slice(0, 80);
      const cwd = await bodyCwd(b);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const child = Bun.spawn([BIN, "-p", message, "--model", model], {
            stdout: "pipe", stderr: "pipe", stdin: "ignore", cwd, env: env(),
          });
          const push = (s: string) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: s })}\n\n`));
          const dec = new TextDecoder();
          const pump = async (rs: ReadableStream<Uint8Array> | null | undefined) => {
            if (!rs) return;
            const reader = rs.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              push(dec.decode(value, { stream: true }));
            }
          };
          Promise.all([pump(child.stdout), pump(child.stderr)]).then(() => {});
          child.exited.then((code) => {
            push(`\n[session ended · exit ${code}]`);
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
            controller.close();
          });
        },
      });
      return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-store", "connection": "keep-alive" } });
    }

    // --- memory ---
    if (url.pathname === "/api/memory" && req.method === "GET") {
      const [query, engram, patterns, stats] = await Promise.all([
        omni(["query", "*"]), omni(["engram"]), omni(["patterns"]), omni(["stats"]),
      ]);
      return json({ ok: true, query, engram, patterns, stats });
    }

    // --- settings ---
    if (url.pathname === "/api/settings" && req.method === "GET") {
      return json(loadSettings());
    }
    if (url.pathname === "/api/settings" && req.method === "POST") {
      const s = await req.json().catch(() => ({}));
      saveSettings(s);
      return json({ ok: true });
    }
    // Manual triggers (for verification / UI buttons). Loops also run automatically.
    if (url.pathname === "/api/heartbeat" && req.method === "POST") {
      const out = await spawnCapture(["-p", "Do ONE small, safe, verifiable improvement to the codebase, then stop."]);
      return json({ ok: true, output: out.slice(0, 2000) });
    }
    if (url.pathname === "/api/telegram/test" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const token = String(b.token ?? "").trim();
      if (!token) return json({ ok: false, error: "token required" }, 400);
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const j = await r.json();
        return json({ ok: j.ok, username: j.result?.username ?? null, error: j.description ?? null });
      } catch (e: any) { return json({ ok: false, error: e?.message ?? String(e) }); }
    }
    // Integrated cron: run a cron job's action immediately (manual trigger from UI).
    if (url.pathname === "/api/cron/run" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const idx = Number(b.index ?? 0);
      const s = loadSettings();
      const job = Array.isArray(s.cron) ? s.cron[idx] : null;
      if (!job) return json({ ok: false, error: "no such cron job" }, 400);
      const prompt = job.action === "goal"
        ? `Call set_goal with text '${String(job.arg ?? "").replace(/'/g, "")}'.`
        : String(job.arg ?? job.action ?? "");
      const cwd = getProjectPath(b.project) || undefined;
      const child = Bun.spawn([BIN, "-p", prompt], { stdout: "ignore", stderr: "ignore", stdin: "ignore", cwd, env: env() });
      return json({ ok: true, pid: child.pid, prompt });
    }

    // Skill Store: GET list (manifest + effective enabled), POST save enabled overrides.
    if (url.pathname === "/api/skills" && req.method === "GET") {
      const idx = join(ROOT, "pina-skills", "index.json");
      const enabledFile = join(PINA, "skills-enabled.json");
      let manifest: any[] = [];
      try { manifest = JSON.parse(readFileSync(idx, "utf8")); } catch {}
      let overrides: any = {};
      try { overrides = JSON.parse(readFileSync(enabledFile, "utf8")); } catch {}
      const list = manifest.map((s) => ({
        id: s.id, name: s.name, desc: s.desc, tags: s.tags ?? [],
        enabled: typeof overrides[s.id] === "boolean" ? overrides[s.id] : (s.defaultEnabled !== false),
      }));
      return json({ ok: true, skills: list });
    }
    if (url.pathname === "/api/skills" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = String(b.id ?? "").trim();
      const enabled = !!b.enabled;
      const idx = join(ROOT, "pina-skills", "index.json");
      let manifest: any[] = [];
      try { manifest = JSON.parse(readFileSync(idx, "utf8")); } catch {}
      if (!manifest.find((s) => s.id === id)) return json({ ok: false, error: "unknown skill" }, 400);
      const enabledFile = join(PINA, "skills-enabled.json");
      let overrides: any = {};
      try { overrides = JSON.parse(readFileSync(enabledFile, "utf8")); } catch {}
      overrides[id] = enabled;
      writeFileSync(enabledFile, JSON.stringify(overrides, null, 2));
      return json({ ok: true, id, enabled });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404 });
  },
});

function json(d: any, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

console.log(`🍍 Pina board → http://127.0.0.1:${server.port}`);
