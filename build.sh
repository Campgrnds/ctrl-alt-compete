#!/usr/bin/env bash
# Regenerate site/questions.js (the offline fallback copy) from site/questions.json.
set -euo pipefail
cd "$(dirname "$0")"
jq empty site/questions.json   # fail loudly on invalid JSON
{ printf '/* Auto-generated from questions.json by build.sh. Edit questions.json, not this file. */\nwindow.QUESTIONS_FALLBACK = '; cat site/questions.json; printf ';\n'; } > site/questions.js
echo "Built site/questions.js"
