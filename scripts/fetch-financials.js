const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const symbols = ['NVDA','AAPL','MSFT','GOOGL','AMZN','META','PLTR','BMNR','AMD','NFLX','COIN','MSTR','TSM','AVGO','SMCI'];

const parse = (r) => ({
  date: r.fiscalDateEnding,
  revenue: parseFloat(r.totalRevenue) || 0,
  grossProfit: parseFloat(r.grossProfit) || 0,
  operatingIncome: parseFloat(r.operatingIncome) || 0,
  netIncome: parseFloat(r.netIncome) || 0,
  ebitda: parseFloat(r.ebitda) || 0,
});

async function fetchOne(sym) {
  try {
    const res = await axios.get('https://www.alphavantage.co/query', {
      params: { function: 'INCOME_STATEMENT', symbol: sym, apikey: process.env.ALPHA_VANTAGE_API_KEY },
      timeout: 30000
    });
    const d = res.data;
    if (d.Information || d.Note) {
      console.log(sym, 'RATE LIMITED');
      return false;
    }
    const data = {
      annual: (d.annualReports || []).slice(0, 5).map(parse).reverse(),
      quarterly: (d.quarterlyReports || []).slice(0, 20).map(parse).reverse(),
    };
    if (data.annual.length === 0) {
      console.log(sym, 'EMPTY');
      return false;
    }
    fs.writeFileSync('.cache/financials/' + sym + '.json', JSON.stringify({ _cachedAt: Date.now(), data }));
    console.log(sym, 'OK', data.annual.length, 'annual', data.quarterly.length, 'quarterly');
    return true;
  } catch (e) {
    console.log(sym, 'ERROR', e.message);
    return false;
  }
}

async function run() {
  fs.mkdirSync('.cache/financials', { recursive: true });
  for (const sym of symbols) {
    const ok = await fetchOne(sym);
    if (!ok) {
      console.log('Stopping - rate limit likely hit');
      break;
    }
    // Alpha Vantage free tier: 5 calls/min => wait 13s between calls
    console.log('  waiting 13s...');
    await new Promise((r) => setTimeout(r, 13000));
  }
  console.log('Done. Files:', fs.readdirSync('.cache/financials'));
}

run();
