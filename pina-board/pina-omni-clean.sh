#!/usr/bin/env bash
# pina-omni-clean — safely truncate OMNI learn_queue without wiping omni.db/config.
#
# OMNI's `omni reset` wipes everything (config + DB). This script only clears the
# local "learning" queue (learn_queue.jsonl) which can grow large and may contain
# command-history PII. omni.db keeps its distillation ledger + memory.
#
# Safe: truncates the file in place (keeps the file, drops queued rows).
set -e
QUEUE="$HOME/.omni/learn_queue.jsonl"
if [ ! -f "$QUEUE" ]; then
  echo "ℹ nothing to clean ($QUEUE absent)"
  exit 0
fi
BEFORE=$(wc -l < "$QUEUE" 2>/dev/null || echo 0)
SIZE=$(du -h "$QUEUE" 2>/dev/null | cut -f1)
# Truncate (keep file, drop contents)
: > "$QUEUE"
echo "✓ truncated $QUEUE ($BEFORE lines / $SIZE freed)"
echo "  omni.db + config untouched — distillation ledger preserved."
