import axios, { AxiosInstance } from "axios";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volume
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubBasicFinancials {
  metric: {
    "10DayAverageTradingVolume"?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "52WeekHighDate"?: string;
    "52WeekLowDate"?: string;
    beta?: number;
    peBasicExclExtraTTM?: number;
    peTTM?: number;
    pbQuarterly?: number;
    psQuarterly?: number;
    psTTM?: number;
    roeTTM?: number;
    roaTTM?: number;
    currentRatioQuarterly?: number;
    debtEquityQuarterly?: number;
    revenuePerShareTTM?: number;
    epsBasicExclExtraItemsTTM?: number;
    netProfitMarginTTM?: number;
    grossMarginTTM?: number;
    operatingMarginTTM?: number;
    dividendYieldIndicatedAnnual?: number;
    marketCapitalization?: number;
  };
  metricType: string;
  symbol: string;
}

class FinnhubClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || "";

    this.client = axios.create({
      baseURL: FINNHUB_BASE_URL,
      timeout: 10000,
      headers: {
        "X-Finnhub-Token": this.apiKey,
      },
    });
  }

  async getQuote(symbol: string): Promise<FinnhubQuote> {
    const response = await this.client.get<FinnhubQuote>("/quote", {
      params: { symbol: symbol.toUpperCase() },
    });
    return response.data;
  }

  async getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile> {
    const response = await this.client.get<FinnhubCompanyProfile>(
      "/stock/profile2",
      {
        params: { symbol: symbol.toUpperCase() },
      }
    );
    return response.data;
  }

  async getCandles(
    symbol: string,
    resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M",
    from: number,
    to: number
  ): Promise<FinnhubCandle> {
    const response = await this.client.get<FinnhubCandle>("/stock/candle", {
      params: {
        symbol: symbol.toUpperCase(),
        resolution,
        from,
        to,
      },
    });
    return response.data;
  }

  async getCompanyNews(
    symbol: string,
    from: string,
    to: string
  ): Promise<FinnhubNews[]> {
    const response = await this.client.get<FinnhubNews[]>("/company-news", {
      params: {
        symbol: symbol.toUpperCase(),
        from,
        to,
      },
    });
    return response.data;
  }

  async getBasicFinancials(symbol: string): Promise<FinnhubBasicFinancials> {
    const response = await this.client.get<FinnhubBasicFinancials>(
      "/stock/metric",
      {
        params: {
          symbol: symbol.toUpperCase(),
          metric: "all",
        },
      }
    );
    return response.data;
  }
}

export const finnhubClient = new FinnhubClient();

// Helper functions for formatted data
export async function getStockQuote(symbol: string) {
  const quote = await finnhubClient.getQuote(symbol);

  return {
    symbol: symbol.toUpperCase(),
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    timestamp: new Date(quote.t * 1000),
  };
}

export async function getStockProfile(symbol: string) {
  const profile = await finnhubClient.getCompanyProfile(symbol);

  return {
    symbol: profile.ticker,
    name: profile.name,
    exchange: profile.exchange,
    industry: profile.finnhubIndustry,
    marketCap: profile.marketCapitalization * 1_000_000, // Convert to actual value
    website: profile.weburl,
    logo: profile.logo,
    country: profile.country,
    currency: profile.currency,
    sharesOutstanding: profile.shareOutstanding * 1_000_000,
    ipoDate: profile.ipo,
  };
}

export async function getStockCandles(
  symbol: string,
  period: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" = "1Y"
) {
  const now = Math.floor(Date.now() / 1000);
  let from: number;
  let resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";

  switch (period) {
    case "1D":
      from = now - 24 * 60 * 60;
      resolution = "5";
      break;
    case "1W":
      from = now - 7 * 24 * 60 * 60;
      resolution = "30";
      break;
    case "1M":
      from = now - 30 * 24 * 60 * 60;
      resolution = "60";
      break;
    case "3M":
      from = now - 90 * 24 * 60 * 60;
      resolution = "D";
      break;
    case "1Y":
      from = now - 365 * 24 * 60 * 60;
      resolution = "D";
      break;
    case "5Y":
      from = now - 5 * 365 * 24 * 60 * 60;
      resolution = "W";
      break;
    default:
      from = now - 365 * 24 * 60 * 60;
      resolution = "D";
  }

  const candles = await finnhubClient.getCandles(symbol, resolution, from, now);

  if (candles.s !== "ok" || !candles.t) {
    return [];
  }

  return candles.t.map((timestamp, i) => ({
    time: timestamp,
    open: candles.o[i],
    high: candles.h[i],
    low: candles.l[i],
    close: candles.c[i],
    volume: candles.v[i],
  }));
}

export async function getStockNews(symbol: string, limit: number = 10) {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const news = await finnhubClient.getCompanyNews(symbol, from, to);

  return news.slice(0, limit).map((item) => ({
    id: item.id.toString(),
    headline: item.headline,
    summary: item.summary,
    url: item.url,
    source: item.source,
    datetime: new Date(item.datetime * 1000),
    image: item.image,
    category: item.category,
  }));
}

export async function getStockMetrics(symbol: string) {
  const financials = await finnhubClient.getBasicFinancials(symbol);
  const { metric } = financials;

  return {
    symbol: financials.symbol,
    valuation: {
      pe: metric.peTTM,
      pb: metric.pbQuarterly,
      ps: metric.psTTM,
    },
    profitability: {
      roe: metric.roeTTM,
      roa: metric.roaTTM,
      grossMargin: metric.grossMarginTTM,
      operatingMargin: metric.operatingMarginTTM,
      netMargin: metric.netProfitMarginTTM,
    },
    growth: {
      revenuePerShare: metric.revenuePerShareTTM,
      eps: metric.epsBasicExclExtraItemsTTM,
    },
    risk: {
      beta: metric.beta,
      debtToEquity: metric.debtEquityQuarterly,
      currentRatio: metric.currentRatioQuarterly,
    },
    trading: {
      "52WeekHigh": metric["52WeekHigh"],
      "52WeekLow": metric["52WeekLow"],
      "52WeekHighDate": metric["52WeekHighDate"],
      "52WeekLowDate": metric["52WeekLowDate"],
      avgVolume10D: metric["10DayAverageTradingVolume"],
    },
    dividend: {
      yield: metric.dividendYieldIndicatedAnnual,
    },
    marketCap: metric.marketCapitalization
      ? metric.marketCapitalization * 1_000_000
      : undefined,
  };
}
