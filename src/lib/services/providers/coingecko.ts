import axios, { AxiosInstance } from "axios";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

interface CoinGeckoMarketData {
  current_price: { usd: number };
  market_cap: { usd: number };
  market_cap_rank: number;
  total_volume: { usd: number };
  high_24h: { usd: number };
  low_24h: { usd: number };
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: { usd: number };
  price_change_percentage_24h_in_currency?: { usd: number };
  price_change_percentage_7d_in_currency?: { usd: number };
  price_change_percentage_30d_in_currency?: { usd: number };
  price_change_percentage_1y_in_currency?: { usd: number };
  ath: { usd: number };
  ath_date: { usd: string };
  ath_change_percentage: { usd: number };
  atl: { usd: number };
  atl_date: { usd: string };
  atl_change_percentage: { usd: number };
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  categories: string[];
  description: { en: string };
  image: { thumb: string; small: string; large: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  genesis_date: string | null;
  hashing_algorithm: string | null;
  market_data: CoinGeckoMarketData;
  last_updated: string;
}

type CoinGeckoMarketChart = {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
};

type CoinGeckoOHLC = [number, number, number, number, number][];

interface CoinGeckoGlobal {
  data: {
    market_cap_percentage: Record<string, number>;
    total_market_cap: { usd: number };
    total_volume: { usd: number };
  };
}

class CoinGeckoClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: COINGECKO_BASE_URL,
      timeout: 12000,
      headers: { Accept: "application/json" },
    });
  }

  async getCoin(id: string): Promise<CoinGeckoCoin> {
    const response = await this.client.get<CoinGeckoCoin>(`/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
        sparkline: false,
      },
    });
    return response.data;
  }

  async getMarketChart(id: string, days: number | "max"): Promise<CoinGeckoMarketChart> {
    const response = await this.client.get<CoinGeckoMarketChart>(
      `/coins/${id}/market_chart`,
      {
        params: { vs_currency: "usd", days },
      }
    );
    return response.data;
  }

  async getOHLC(id: string, days: 1 | 7 | 14 | 30 | 90 | 180 | 365 | "max"): Promise<CoinGeckoOHLC> {
    const response = await this.client.get<CoinGeckoOHLC>(`/coins/${id}/ohlc`, {
      params: { vs_currency: "usd", days },
    });
    return response.data;
  }

  async getGlobal(): Promise<CoinGeckoGlobal> {
    const response = await this.client.get<CoinGeckoGlobal>("/global");
    return response.data;
  }
}

export const coingeckoClient = new CoinGeckoClient();

export type CryptoChartPeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export interface CryptoQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  marketCap: number;
  volume24h: number;
  rank: number;
  ath: number;
  atl: number;
  athChangePercent: number;
  atlChangePercent: number;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  priceChange1h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  priceChange1y: number | null;
}

export interface CryptoProfile {
  symbol: string;
  name: string;
  description: string;
  logo: string;
  homepage: string;
  categories: string[];
  hashingAlgorithm: string | null;
  genesisDate: string | null;
  marketCap: number;
  rank: number;
  circulatingSupply: number | null;
  maxSupply: number | null;
}

export interface CryptoCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Map a generic chart period to a CoinGecko `days` value supported by /ohlc. */
function periodToDays(period: CryptoChartPeriod): 1 | 7 | 30 | 90 | 365 | "max" {
  switch (period) {
    case "1D":
      return 1;
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "1Y":
      return 365;
    case "5Y":
      return "max";
  }
}

/**
 * Build daily candles from /coins/{id}/market_chart, used as a long-history
 * fallback because /ohlc on the free tier truncates 1Y / 5Y requests.
 * The endpoint returns daily close prices; we synthesize each day's OHLC
 * by treating the previous day's close as the open so candles render as
 * directional bars instead of flat lines.
 */
async function getDailyCandlesFromMarketChart(
  coinId: string,
  days: number | "max"
): Promise<CryptoCandle[]> {
  const chart = await coingeckoClient.getMarketChart(coinId, days);
  const volByDay = new Map<number, number>();
  for (const [ts, vol] of chart.total_volumes) {
    const day = Math.floor(ts / 86400000);
    volByDay.set(day, (volByDay.get(day) ?? 0) + vol);
  }

  return chart.prices.map(([ts, price], i, arr) => {
    const open = i > 0 ? arr[i - 1][1] : price;
    const close = price;
    const high = Math.max(open, close);
    const low = Math.min(open, close);
    const day = Math.floor(ts / 86400000);
    return {
      time: Math.floor(ts / 1000),
      open,
      high,
      low,
      close,
      volume: volByDay.get(day) ?? 0,
    };
  });
}

export async function getCryptoQuote(coinId: string, symbol: string): Promise<CryptoQuote> {
  const coin = await coingeckoClient.getCoin(coinId);
  const md = coin.market_data;
  const price = md.current_price.usd;
  const previousClose = price - md.price_change_24h;

  return {
    symbol: symbol.toUpperCase(),
    price,
    change: md.price_change_24h,
    changePercent: md.price_change_percentage_24h,
    high: md.high_24h.usd,
    low: md.low_24h.usd,
    open: previousClose,
    previousClose,
    timestamp: new Date(coin.last_updated),
    marketCap: md.market_cap.usd,
    volume24h: md.total_volume.usd,
    rank: md.market_cap_rank,
    ath: md.ath.usd,
    atl: md.atl.usd,
    athChangePercent: md.ath_change_percentage.usd,
    atlChangePercent: md.atl_change_percentage.usd,
    circulatingSupply: md.circulating_supply,
    totalSupply: md.total_supply,
    maxSupply: md.max_supply,
    priceChange1h: md.price_change_percentage_1h_in_currency?.usd ?? null,
    priceChange7d: md.price_change_percentage_7d_in_currency?.usd ?? null,
    priceChange30d: md.price_change_percentage_30d_in_currency?.usd ?? null,
    priceChange1y: md.price_change_percentage_1y_in_currency?.usd ?? null,
  };
}

export async function getCryptoProfile(coinId: string, symbol: string): Promise<CryptoProfile> {
  const coin = await coingeckoClient.getCoin(coinId);
  const homepage = coin.links.homepage.find((u) => u && u.length > 0) ?? "";

  return {
    symbol: symbol.toUpperCase(),
    name: coin.name,
    description: coin.description.en || "",
    logo: coin.image.large || coin.image.small || coin.image.thumb,
    homepage,
    categories: coin.categories.filter(Boolean),
    hashingAlgorithm: coin.hashing_algorithm,
    genesisDate: coin.genesis_date,
    marketCap: coin.market_data.market_cap.usd,
    rank: coin.market_data.market_cap_rank,
    circulatingSupply: coin.market_data.circulating_supply,
    maxSupply: coin.market_data.max_supply,
  };
}

export async function getCryptoCandles(
  coinId: string,
  period: CryptoChartPeriod
): Promise<CryptoCandle[]> {
  const days = periodToDays(period);

  // For 1Y / 5Y: free-tier /ohlc tops out at ~90 points regardless of `days`,
  // which prevents SMA200 / long-window indicators. Fall back to /market_chart
  // (close-only daily series) which provides one point per day for the full range.
  if (period === "1Y" || period === "5Y") {
    return getDailyCandlesFromMarketChart(coinId, days);
  }

  const [ohlc, chart] = await Promise.all([
    coingeckoClient.getOHLC(coinId, days),
    coingeckoClient.getMarketChart(coinId, days),
  ]);

  // Build a volume lookup keyed by minute to align with OHLC timestamps.
  const volumeByMinute = new Map<number, number>();
  for (const [ts, vol] of chart.total_volumes) {
    const minute = Math.floor(ts / 60000);
    volumeByMinute.set(minute, vol);
  }

  return ohlc.map(([ts, open, high, low, close]) => {
    const minute = Math.floor(ts / 60000);
    const volume =
      volumeByMinute.get(minute) ??
      volumeByMinute.get(minute - 1) ??
      volumeByMinute.get(minute + 1) ??
      0;
    return {
      time: Math.floor(ts / 1000),
      open,
      high,
      low,
      close,
      volume,
    };
  });
}

/** BTC dominance (% of total crypto market cap). */
export async function getBitcoinDominance(): Promise<number | null> {
  try {
    const global = await coingeckoClient.getGlobal();
    return global.data.market_cap_percentage.btc ?? null;
  } catch {
    return null;
  }
}
