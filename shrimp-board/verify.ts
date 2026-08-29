#!/usr/bin/env bun
// Self-contained verification: boots the server in-process, hits it via fetch,
// prints results, then exits. No backgrounding needed.
import "./server.ts"; // side-effect: starts Bun.serve on :8787

const base = "http://127.0.0.1:8787";
await new Promise((r) => setTimeout(r, 300));

// 1) board API
const b = await fetch(base + "/api/board").then((r) => r.json());
console.log("STATES:", b.states.join(" -> "));
console.log("COUNTS:", b.states.map((s: string, i: number) => `${s}:${b.counts[i]}`).join("  "));
console.log("BOARD JSON OK:", typeof b.columns === "object");

// 2) html
const html = await fetch(base + "/").then((r) => r.text());
console.log("HTML OK:", html.includes("Shrimp Kanban") && html.includes("/api/board"));

// 3) move persistence (#2 -> WORKING)
await fetch(base + "/api/move", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ id: 2, state: "WORKING" }),
});
const b2 = await fetch(base + "/api/board").then((r) => r.json());
const working = b2.columns["WORKING"].map((t: any) => t.id);
console.log("MOVE #2 -> WORKING persisted:", working.includes(2));

// 5) agent panel
const ag = await fetch(base + "/api/agent").then((r) => r.json());
console.log("AGENT OK:", ag.ok && ag.session && typeof ag.session.command_count === "number");
console.log("AGENT commands:", ag.session?.command_count, "savings%:", ag.stats?.periods?.at(-1)?.savings_pct?.toFixed?.(1));

// 6) launch agent endpoint (spawn shrimp -p with a quick prompt)
const lp = await fetch(base + "/api/launch", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ prompt: "echo launch-test-ok" }),
});
const lj = await lp.json();
console.log("LAUNCH OK:", lj.ok && typeof lj.pid === "number", "pid:", lj.pid);
// give it a moment then kill the spawned shrimp so we don't leave it running
try { if (lj.pid) process.kill(lj.pid, "SIGTERM"); } catch {}

// 7) undo last transition (move #2 WORKING -> TODO)
const u = await fetch(base + "/api/undo", { method: "POST" }).then((r) => r.json());
const afterUndo = await fetch(base + "/api/board").then((r) => r.json());
const backTodo = afterUndo.columns["TODO"].some((t: any) => t.id === 2);
console.log("UNDO OK:", u.ok && backTodo, "(#2 back to TODO)");

// 8) revert any stray move so we leave board clean
await fetch(base + "/api/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: 2, state: "TODO" }) });
console.log("REVERTED #2 -> TODO");
process.exit(0);
