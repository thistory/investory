/**
 * Lightweight technical indicator math used as a fallback when a provider
 * does not expose pre-computed indicators (e.g. crypto via CoinGecko).
 *
 * All functions take a closing-price series ordered oldest -> newest and
 * return a single number computed against the latest close, or null when
 * there is not enough data.
 */

/** Simple moving average over the last `period` closes. */
export function sma(closes: number[], period: number): number | null {
  if (closes.length < period || period <= 0) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/** Exponential moving average over the full series, returning the latest value. */
export function ema(closes: number[], period: number): number | null {
  if (closes.length < period || period <= 0) return null;
  const k = 2 / (period + 1);
  // Seed with SMA of the first `period` values
  let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    prev = closes[i] * k + prev * (1 - k);
  }
  return prev;
}

/** RSI(14) using Wilder's smoothing. */
export function rsi(closes: number[], period: number = 14): number | null {
  if (closes.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface MacdResult {
  macd: number;
  signal: number;
  histogram: number;
}

/** MACD(12, 26, 9). Returns latest macd, signal, histogram. */
export function macd(
  closes: number[],
  fast: number = 12,
  slow: number = 26,
  signalPeriod: number = 9
): MacdResult | null {
  if (closes.length < slow + signalPeriod) return null;

  // Build full EMA series for fast and slow
  const buildEma = (period: number): number[] => {
    const k = 2 / (period + 1);
    const out: number[] = [];
    let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    out[period - 1] = prev;
    for (let i = period; i < closes.length; i++) {
      prev = closes[i] * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  };

  const emaFast = buildEma(fast);
  const emaSlow = buildEma(slow);
  const macdLine: number[] = [];
  for (let i = slow - 1; i < closes.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i]);
  }

  if (macdLine.length < signalPeriod) return null;

  // EMA of macd line for signal
  const k = 2 / (signalPeriod + 1);
  let prev =
    macdLine.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  for (let i = signalPeriod; i < macdLine.length; i++) {
    prev = macdLine[i] * k + prev * (1 - k);
  }
  const macdValue = macdLine[macdLine.length - 1];
  const signal = prev;
  return { macd: macdValue, signal, histogram: macdValue - signal };
}

/** Bollinger Bands (period, stdDev) on the latest close. */
export function bollingerBands(
  closes: number[],
  period: number = 20,
  stdMult: number = 2
): { upper: number; middle: number; lower: number } | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, x) => acc + (x - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: mean + stdMult * std,
    middle: mean,
    lower: mean - stdMult * std,
  };
}
