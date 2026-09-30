#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN required}"
: "${REPO:?REPO required}"

audit_date="$(TZ=America/Chicago date +%F)"
audit_time="$(TZ=America/Chicago date +%H:%M:%S)"
prior="$(TZ=America/Chicago date -d yesterday +%F)"
sha="$(gh api repos/$REPO/commits/main --jq .sha)"
runs="$(gh api 'repos/'$REPO'/actions/runs?branch=main&per_page=100')"

result() {
  jq -r --arg s "$sha" --arg n "$1" '.workflow_runs[]|select(.name==$n and .head_sha==$s)|.conclusion' <<<"$runs" | head -1
}
run_id() {
  jq -r --arg s "$sha" --arg n "$1" '.workflow_runs[]|select(.name==$n and .head_sha==$s)|.id' <<<"$runs" | head -1
}

ci="$(result 'Deterministic publication CI')"
pages="$(result 'pages build and deployment')"
delta="$(result 'Daily AI Brief deterministic delta validation')"
ci_id="$(run_id 'Deterministic publication CI')"
pages_id="$(run_id 'pages build and deployment')"
delta_id="$(run_id 'Daily AI Brief deterministic delta validation')"
rules="$(gh api repos/$REPO/rulesets/23615327 --jq .enforcement 2>/dev/null || echo unavailable)"

read_repo_json() {
  gh api "repos/$REPO/contents/$1?ref=main" --jq .content 2>/dev/null | tr -d '\n' | base64 -d 2>/dev/null || true
}
lifecycle="$(read_repo_json _records/publication/$prior/lifecycle.json)"
completion="$(read_repo_json _records/publication/$prior/completion.json)"
runstate="$(read_repo_json _records/run-state/$prior.json)"

ls="$(jq -r '.stage//"Unavailable"' <<<"$lifecycle" 2>/dev/null || echo Unavailable)"
lo="$(jq -r '.terminal_outcome//"Unavailable"' <<<"$lifecycle" 2>/dev/null || echo Unavailable)"
cp="$(jq -r '.phase//"Unavailable"' <<<"$completion" 2>/dev/null || echo Unavailable)"
pg="$(jq -r '.pages.conclusion//"Unavailable"' <<<"$completion" 2>/dev/null || echo Unavailable)"
rs="$(jq -r '.stage//"Unavailable"' <<<"$runstate" 2>/dev/null || echo Unavailable)"

blockers=0
warnings=1

[ "$ci" = success ] || blockers=$((blockers+1))
[ "$pages" = success ] || blockers=$((blockers+1))
[ "$delta" = success ] || blockers=$((blockers+1))
[ "$rules" = active ] || blockers=$((blockers+1))

closed=no
if { [ "$ls" = COMPLETED ] || [ "$ls" = CC_SYNCED ]; } &&
   [ "$lo" = COMPLETED ] && [ "$cp" = live_verified ] && [ "$pg" = success ]; then
  closed=yes
else
  warnings=$((warnings+1))
fi

if [ "$rs" != Unavailable ] && [ "$ls" != Unavailable ] && [ "$rs" != "$ls" ]; then
  warnings=$((warnings+1))
fi

nondraft="$(gh api 'repos/'$REPO'/pulls?state=open&per_page=100' --jq '[.[] | select(.draft==false and (.title|test("CANARY|DO NOT MERGE";"i")|not))] | length')"
[ "$nondraft" -eq 0 ] || warnings=$((warnings+1))

if [ "$blockers" -gt 0 ]; then verdict="NOT READY"; emoji="🔴"
elif [ "$warnings" -gt 0 ]; then verdict="READY WITH WARNINGS"; emoji="🟡"
else verdict="READY"; emoji="🟢"
fi

path="nightly-readiness/Daily_AI_Brief_Nightly_Readiness_${audit_date}.md"
url="https://github.com/$REPO/blob/ops/nightly-readiness/$path"

cat >/tmp/readiness.md <<EOF
# Daily Generative AI Brief — Nightly Readiness Report

## $emoji $verdict

Audit: $audit_date $audit_time America/Chicago
Current main SHA: $sha

| Check | Result |
|---|---|
| Deterministic publication CI | $ci |
| GitHub Pages | $pages |
| Deterministic delta validation | $delta |
| Main protection ruleset | $rules |
| Prior edition lifecycle | $ls / $lo / $cp / $pg |
| Work/Codex invoked | No |

## Current evidence

- CI run: ${ci_id:-Unavailable}
- Pages run: ${pages_id:-Unavailable}
- Delta-validation run: ${delta_id:-Unavailable}
- Prior edition: $prior
- Legacy run-state: $rs
- Open non-draft PRs requiring awareness: $nondraft

## Expected daily sequence

03:00 metadata -> 03:15 discovery/evidence -> 04:00 production -> 06:30 recovery -> 08:30 validation/repair -> 09:15 freshness -> 10:00 delta validation -> 10:30 closure.

GitHub Actions cannot directly inspect the live ChatGPT automation registry. The ChatGPT times are the current operational contract, not live-verified schedule state.

## Final

Nightly readiness: $verdict
Current main SHA: $sha
Blocking issues: $blockers
Warnings: $warnings
Work/Codex invoked: No
Recommended action before 03:00: $([ "$blockers" -gt 0 ] && echo "Resolve blockers." || echo "No GitHub-side action required.")
EOF

b64="$(base64 -w0 /tmp/readiness.md)"
old="$(gh api "repos/$REPO/contents/$path?ref=ops/nightly-readiness" --jq .sha 2>/dev/null || true)"
if [ -n "$old" ]; then
  gh api --method PUT "repos/$REPO/contents/$path" -f message="Nightly readiness $audit_date" -f content="$b64" -f branch=ops/nightly-readiness -f sha="$old" >/dev/null
else
  gh api --method PUT "repos/$REPO/contents/$path" -f message="Nightly readiness $audit_date" -f content="$b64" -f branch=ops/nightly-readiness >/dev/null
fi

body="@gttome $emoji $verdict — Daily Brief nightly readiness

Audit: $audit_date $audit_time America/Chicago
Current main: $sha
Blocking issues: $blockers
Warnings: $warnings
Work/Codex invoked: No
Full report: $url"

gh api --method POST repos/$REPO/issues/234/comments -f body="$body" >/dev/null
