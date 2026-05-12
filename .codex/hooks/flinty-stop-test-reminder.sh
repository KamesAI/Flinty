#!/usr/bin/env bash
# Stop — une passe de rappel si la réponse ressemble à une livraison sans preuve de tests.
set -euo pipefail
INPUT=$(cat)
python3 - "$INPUT" <<'PY'
import json, re, sys

raw = sys.argv[1].strip() if len(sys.argv) > 1 else ""
if not raw:
    raise SystemExit(0)
try:
    d = json.loads(raw)
except json.JSONDecodeError:
    raise SystemExit(0)

if d.get("stop_hook_active"):
    raise SystemExit(0)

msg = d.get("last_assistant_message") or ""
if len(msg) < 40:
    raise SystemExit(0)

done_pat = re.compile(
    r"(terminé|complété|achevé|finalisé|livraison|pr[eê]t\b|"
    r"implementation is complete|task is complete|all (set|done)|"
    r"merged? successfully|ready (for|to) (review|merge)|"
    r"peux merger|tu peux merger)",
    re.I,
)
if not done_pat.search(msg):
    raise SystemExit(0)

proof = re.compile(
    r"(npm run test|vitest|tests?\s+(pass|passed|ok|green)|"
    r"✓\s*\d+|Test Files\s+\d+|passed\s*\(|"
    r"(pas de tests|aucun test|non applicable|N/A)\s*(pour ce changement)?)",
    re.I,
)
if proof.search(msg):
    raise SystemExit(0)

reason = (
    "Flinty : la dernière réponse ressemble à une livraison complète sans mention "
    "d'exécution de npm run test (Vitest) depuis lead-qualifier-dashboard, ni "
    "d'exemption explicite. Lance la suite et résume la sortie, ou indique "
    "clairement pourquoi les tests ne s'appliquent pas."
)
sys.stdout.write(json.dumps({"decision": "block", "reason": reason}))
PY
