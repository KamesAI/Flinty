#!/usr/bin/env bash
# PostToolUse — rappel contextuel après écriture/édition TS du dashboard (pas de format auto : pas de Prettier projet).
set -euo pipefail
INPUT=$(cat)
python3 - "$INPUT" <<'PY'
import json, sys

raw = sys.argv[1].strip() if len(sys.argv) > 1 else ""
if not raw:
    raise SystemExit(0)
try:
    d = json.loads(raw)
except json.JSONDecodeError:
    raise SystemExit(0)

ti = d.get("tool_input") or {}
fp = ti.get("file_path") or ti.get("path") or ""
if not fp:
    tr = d.get("tool_response") or {}
    fp = tr.get("filePath") or tr.get("file_path") or ""
fp = (fp or "").replace("\\", "/")
marker = "lead-qualifier-dashboard"
if marker not in fp:
    raise SystemExit(0)
if not (fp.endswith(".ts") or fp.endswith(".tsx")):
    raise SystemExit(0)
if fp.endswith(".d.ts"):
    raise SystemExit(0)

ctx = (
    "The lead-qualifier-dashboard app uses Vitest; the command is `npm run test` "
    "run from `.workflows/02-Implementation/interface/lead-qualifier-dashboard/`. "
    "Flinty convention: new or changed `lib/*.ts` and `app/**/*.ts` should have "
    "tests updated in the same change."
)
sys.stdout.write(
    json.dumps(
        {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": ctx,
            }
        }
    )
)
PY
