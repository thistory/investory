#!/usr/bin/env node
/**
 * Fetch structured stock data for analysis reports.
 * Usage: node scripts/fetch-stock-data.js TSLA [NVDA] [PLTR] ...
 * Output: .cache/analysis/{SYMBOL}.json
 *
 * Fetches: price, market cap, technicals (SMA, RSI), analyst targets, 52-week range
 * Sources: Yahoo Finance API (no key required)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', '.cache', 'analysis');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse failed')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Convert investory ticker (e.g. BTCUSDT) to Yahoo Finance ticker (BTC-USD).
// Stocks pass through unchanged.
const CRYPTO_QUOTE_SUFFIXES = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI'];
function toYahooSymbol(symbol) {
  for (const suffix of CRYPTO_QUOTE_SUFFIXES) {
    if (symbol.endsWith(suffix) && symbol.length > suffix.length) {
      const base = symbol.slice(0, -suffix.length);
      return `${base}-USD`;
    }
  }
  return symbol;
}

async function fetchQuote(symbol) {
  const yahooSym = toYahooSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=1y&includePrePost=false`;
  const data = await fetch(url);
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const closes = result.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
  const price = meta.regularMarketPrice;

  // Calculate SMAs
  const sma50 = closes.length >= 50
    ? +(closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2)
    : null;
  const sma200 = closes.length >= 200
    ? +(closes.slice(-200).reduce((a, b) => a + b, 0) / 200).toFixed(2)
    : null;

  // Calculate RSI (14-day)
  let rsi = null;
  if (closes.length >= 15) {
    const changes = closes.slice(-15).map((c, i, a) => i === 0 ? 0 : c - a[i - 1]).slice(1);
    const gains = changes.map((c) => (c > 0 ? c : 0));
    const losses = changes.map((c) => (c < 0 ? -c : 0));
    const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
    rsi = avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2);
  }

  // 52-week high/low
  const yearCloses = closes.slice(-252);
  const week52High = +Math.max(...yearCloses).toFixed(2);
  const week52Low = +Math.min(...yearCloses).toFixed(2);
  const currentPositionPercent = +((price - week52Low) / (week52High - week52Low) * 100).toFixed(1);

  // Market cap formatting — Yahoo does not expose marketCap for crypto pairs,
  // so emit the field only when a real value is available. The previous report's
  // marketCap is then preserved during finalize-report's merge step.
  const mcap = meta.marketCap;
  const marketCap = mcap && mcap > 0
    ? mcap >= 1e12 ? `$${(mcap / 1e12).toFixed(2)}T`
      : mcap >= 1e9 ? `$${(mcap / 1e9).toFixed(1)}B`
      : mcap >= 1e6 ? `$${(mcap / 1e6).toFixed(0)}M`
      : `$${mcap}`
    : undefined;

  const out = {
    symbol,
    currentPrice: price,
    technicalPosition: {
      week52High,
      week52Low,
      currentPositionPercent,
      sma50,
      sma50Signal: sma50 ? (price > sma50 ? 'above' : 'below') : null,
      sma200,
      sma200Signal: sma200 ? (price > sma200 ? 'above' : 'below') : null,
      rsi,
      rsiSignal: rsi ? (rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral') : null,
    },
    _fetchedAt: new Date().toISOString(),
  };
  if (marketCap) out.marketCap = marketCap;
  return out;
}

async function run() {
  const symbols = process.argv.slice(2).map((s) => s.toUpperCase());
  if (symbols.length === 0) {
    console.error('Usage: node scripts/fetch-stock-data.js TSLA [NVDA] ...');
    process.exit(1);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  for (const sym of symbols) {
    try {
      const data = await fetchQuote(sym);
      const outPath = path.join(CACHE_DIR, `${sym}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log(`${sym}: $${data.currentPrice} | SMA50=${data.technicalPosition.sma50} SMA200=${data.technicalPosition.sma200} RSI=${data.technicalPosition.rsi} → ${outPath}`);
    } catch (e) {
      console.error(`${sym}: FAILED - ${e.message}`);
    }
  }
}

run();
