#!/bin/bash
# Investory Daily Report Publisher
# Triggered by: claude-investory.timer
# Flow: fetch data (code) → analyze (claude) → finalize (code) → deploy (rsync)
set -uo pipefail

export HOME="/home/openclaw"
export PATH="$HOME/.bun/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export TZ="Asia/Seoul"

INVESTORY_DIR="$HOME/investory"
LOG_DIR="$INVESTORY_DIR/logs"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/publish-${TODAY}.log"

mkdir -p "$LOG_DIR" "$INVESTORY_DIR/.cache/analysis"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S KST')] $1" | tee -a "$LOG_FILE"; }

# Log rotation: keep last 14 days
find "$LOG_DIR" -name "publish-*.log" -mtime +14 -delete 2>/dev/null

log "========================================="
log "Investory Publish — $TODAY"
log "========================================="

cd "$INVESTORY_DIR"

# Active tickers (manually curated)
TICKERS="TSLA BMNR BTCUSDT"
log "Tickers: $TICKERS"

# Check if already published today (check first ticker)
FIRST_TICKER=$(echo "$TICKERS" | awk '{print $1}')
if [ -f "data/analysis/reports/${FIRST_TICKER}/${TODAY}.json" ]; then
  log "Today's reports already exist. Skipping."
  exit 0
fi

# Step 0: Pull latest code (skills, scripts)
log "[Step 0] Pulling latest code..."
git pull --ff-only 2>&1 | tee -a "$LOG_FILE" || true

# Step 1: Fetch stock data (code, ~5 sec)
log "[Step 1/5] Fetching stock data..."
if node scripts/fetch-stock-data.js $TICKERS 2>&1 | tee -a "$LOG_FILE"; then
  log "[Step 1/5] Data fetch complete."
else
  log "[Step 1/5] WARNING: Data fetch had errors."
fi

# Step 2: Korean analysis (claude sonnet, per ticker)
log "[Step 2/5] Generating Korean reports..."
for TICKER in $TICKERS; do
  PREV_REPORT=$(ls -t "data/analysis/reports/${TICKER}/"*.json 2>/dev/null | grep -v '.en.json' | head -1)
  log "  $TICKER: analyzing (prev: $PREV_REPORT)..."

  claude --dangerously-skip-permissions --model sonnet -p \
    "You are writing a stock analysis report for ${TICKER} dated ${TODAY}.
Read .cache/analysis/${TICKER}.json for pre-fetched price/technicals.
Read the previous report: ${PREV_REPORT} — reuse businessSummary, growthDrivers, competitiveAdvantage.
Read .claude/skills/stock-analysis/refs/json-schema.md for schema.
Read .claude/skills/stock-analysis/refs/sns-format.md for SNS format.
Search for recent ${TICKER} news (2-3 searches only).
Update: recentNews, keyMetrics, analystOpinions, risks, buyReasons, overallOpinion, investmentVerdict, sources, snsContent.
Do NOT generate fact tone. No em dashes or interpuncts. Korean, beginner-friendly. Sources 8+.
Write to: data/analysis/reports/${TICKER}/${TODAY}.json" \
    --allowedTools "WebSearch,WebFetch,Read,Write,Edit,Bash,Grep,Glob" \
    --max-turns 25 \
    2>&1 | tee -a "$LOG_FILE"

  if [ -f "data/analysis/reports/${TICKER}/${TODAY}.json" ]; then
    log "  $TICKER: Korean report created."
  else
    log "  $TICKER: WARNING — Korean report not created!"
  fi
done
log "[Step 2/5] Korean reports complete."

# Step 3: English translation (claude haiku, per ticker)
log "[Step 3/5] Translating to English..."
for TICKER in $TICKERS; do
  KO_REPORT="data/analysis/reports/${TICKER}/${TODAY}.json"
  [ ! -f "$KO_REPORT" ] && { log "  $TICKER: skipping (no Korean report)"; continue; }

  log "  $TICKER: translating..."
  claude --dangerously-skip-permissions --model haiku -p \
    "Translate the Korean stock analysis report to natural English (Bloomberg/WSJ tone).
Read: ${KO_REPORT}
Read: .claude/skills/stock-analysis/refs/sns-format.md
Keep all numbers unchanged. Do NOT generate fact tone. No em dashes or interpuncts.
Write to: data/analysis/reports/${TICKER}/${TODAY}.en.json" \
    --allowedTools "Read,Write,Edit,Bash,Grep,Glob" \
    --max-turns 10 \
    2>&1 | tee -a "$LOG_FILE"

  if [ -f "data/analysis/reports/${TICKER}/${TODAY}.en.json" ]; then
    log "  $TICKER: English report created."
  else
    log "  $TICKER: WARNING — English report not created!"
  fi
done
log "[Step 3/5] English translations complete."

# Step 4: Finalize (code)
log "[Step 4/5] Finalizing reports..."
for TICKER in $TICKERS; do
  [ ! -f "data/analysis/reports/${TICKER}/${TODAY}.json" ] && continue
  node scripts/finalize-report.js "$TICKER" "$TODAY" 2>&1 | tee -a "$LOG_FILE"
done
log "[Step 4/5] Finalize complete."

# Pre-deploy verify: every ticker must have today's report.
# Without this, a Claude auth failure would silently re-deploy stale data.
EXPECTED=$(echo $TICKERS | wc -w)
ACTUAL=0
for TICKER in $TICKERS; do
  [ -f "data/analysis/reports/${TICKER}/${TODAY}.json" ] && ACTUAL=$((ACTUAL+1))
done
if [ "$ACTUAL" -lt "$EXPECTED" ]; then
  log "FATAL: Only $ACTUAL/$EXPECTED today's reports created. Skipping deploy."
  exit 1
fi
log "Pre-deploy verify OK: $ACTUAL/$EXPECTED today's reports present."

# Step 5: Deploy data to investory server (rsync only, no build needed)
log "[Step 5/5] Deploying to investory server..."
if rsync -azP data/ investory:/opt/investory/data/ 2>&1 | tee -a "$LOG_FILE"; then
  log "  Data synced."
else
  log "  ERROR: rsync failed!"
  exit 1
fi

if ssh investory "sudo systemctl restart investory" 2>&1 | tee -a "$LOG_FILE"; then
  sleep 5
  HEALTH=$(ssh investory "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/" 2>/dev/null)
  log "  Service restarted. Health: $HEALTH"
else
  log "  ERROR: Service restart failed!"
  exit 1
fi

log "========================================="
log "Investory Publish — DONE ($TICKERS)"
log "========================================="
