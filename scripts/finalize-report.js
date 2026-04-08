#!/usr/bin/env node
/**
 * Post-process analysis reports: merge data, copy fact tones, update index.
 * Usage: node scripts/finalize-report.js TSLA 2026-04-09
 *
 * Tasks:
 * 1. Merge cached stock data into report JSON (price, technicals)
 * 2. Copy base SNS → tones.*.fact (no LLM needed for fact tone)
 * 3. Update index files (index.json, index.en.json)
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'data', 'analysis', 'reports');
const INDEX_DIR = path.join(__dirname, '..', 'data', 'analysis');
const CACHE_DIR = path.join(__dirname, '..', '.cache', 'analysis');

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

// Copy base SNS content as fact tone (eliminating duplicate LLM generation)
function copyFactTone(report) {
  if (!report.snsContent) return report;
  const sns = report.snsContent;

  if (!sns.tones) sns.tones = {};

  // x fact = base x
  if (sns.x) {
    if (!sns.tones.x) sns.tones.x = {};
    sns.tones.x.fact = { ...sns.x };
  }

  // threads fact = base threads
  if (sns.threads) {
    if (!sns.tones.threads) sns.tones.threads = {};
    sns.tones.threads.fact = { ...sns.threads };
  }

  return report;
}

// Merge cached stock data (price, technicals) into report
function mergeCachedData(report, symbol) {
  const cachePath = path.join(CACHE_DIR, `${symbol}.json`);
  const cached = readJSON(cachePath);
  if (!cached) return report;

  if (cached.currentPrice) report.currentPrice = cached.currentPrice;
  if (cached.marketCap) report.marketCap = cached.marketCap;
  if (cached.technicalPosition) {
    report.technicalPosition = { ...report.technicalPosition, ...cached.technicalPosition };
  }
  return report;
}

// Build index entry from report
function buildIndexEntry(report) {
  return {
    symbol: report.symbol,
    companyName: report.companyName,
    analysisDate: report.analysisDate,
    currentPrice: report.currentPrice,
    marketCap: report.marketCap,
    oneLiner: report.businessSummary?.oneLiner || '',
    buyReasonTitles: (report.buyReasons || []).map((r) => r.title),
    riskTitles: (report.risks || []).map((r) => r.title),
    highRiskCount: (report.risks || []).filter((r) => r.severity === 'critical' || r.severity === 'high').length,
    consensusTarget: report.analystOpinions?.consensusTarget || 0,
    upsidePercent: report.analystOpinions?.upsidePercent || 0,
    sourceCount: (report.sources || []).length,
  };
}

// Update index file (add or replace entry for this symbol+date)
function updateIndex(indexPath, entry) {
  let index = readJSON(indexPath) || [];
  // Remove existing entry for same symbol+date
  index = index.filter((e) => !(e.symbol === entry.symbol && e.analysisDate === entry.analysisDate));
  index.push(entry);
  // Sort by date desc, then symbol
  index.sort((a, b) => b.analysisDate.localeCompare(a.analysisDate) || a.symbol.localeCompare(b.symbol));
  writeJSON(indexPath, index);
  return index.length;
}

function run() {
  const [symbol, date] = process.argv.slice(2);
  if (!symbol || !date) {
    console.error('Usage: node scripts/finalize-report.js TSLA 2026-04-09');
    process.exit(1);
  }

  const sym = symbol.toUpperCase();
  const koPath = path.join(REPORTS_DIR, sym, `${date}.json`);
  const enPath = path.join(REPORTS_DIR, sym, `${date}.en.json`);

  // Process Korean report
  let ko = readJSON(koPath);
  if (!ko) { console.error(`Korean report not found: ${koPath}`); process.exit(1); }

  ko = mergeCachedData(ko, sym);
  ko = copyFactTone(ko);
  writeJSON(koPath, ko);
  console.log(`KO: merged + fact tone copied → ${koPath}`);

  // Process English report
  let en = readJSON(enPath);
  if (en) {
    en = mergeCachedData(en, sym);
    en = copyFactTone(en);
    writeJSON(enPath, en);
    console.log(`EN: merged + fact tone copied → ${enPath}`);
  }

  // Update indexes
  const koIndex = path.join(INDEX_DIR, 'index.json');
  const enIndex = path.join(INDEX_DIR, 'index.en.json');

  const koCount = updateIndex(koIndex, buildIndexEntry(ko));
  console.log(`Index (ko): ${koCount} entries → ${koIndex}`);

  if (en) {
    const enCount = updateIndex(enIndex, buildIndexEntry(en));
    console.log(`Index (en): ${enCount} entries → ${enIndex}`);
  }
}

run();
