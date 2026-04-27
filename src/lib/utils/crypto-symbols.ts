/**
 * Crypto symbol detection and CoinGecko ID mapping.
 *
 * Crypto symbols use the {BASE}{QUOTE} convention (e.g., BTCUSDT, ETHUSD)
 * common on Binance/CoinGecko. We detect by suffix and map BASE to a
 * CoinGecko coin id.
 */

const QUOTE_SUFFIXES = ["USDT", "USDC", "USD", "BUSD", "DAI"] as const;

const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  TRX: "tron",
  MATIC: "matic-network",
  LINK: "chainlink",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  ATOM: "cosmos",
  UNI: "uniswap",
  XLM: "stellar",
  ETC: "ethereum-classic",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  TON: "the-open-network",
  SUI: "sui",
  PEPE: "pepe",
  SHIB: "shiba-inu",
};

/** True if symbol looks like a crypto pair (BASE + USDT/USDC/USD/BUSD/DAI). */
export function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  return QUOTE_SUFFIXES.some(
    (suffix) => upper.endsWith(suffix) && upper.length > suffix.length
  );
}

/** Extract the base asset (e.g., BTCUSDT -> BTC). Returns null if not crypto. */
export function getBaseAsset(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  for (const suffix of QUOTE_SUFFIXES) {
    if (upper.endsWith(suffix) && upper.length > suffix.length) {
      return upper.slice(0, -suffix.length);
    }
  }
  return null;
}

/** Map a crypto symbol to its CoinGecko coin id. Returns null if unmapped. */
export function getCoinGeckoId(symbol: string): string | null {
  const base = getBaseAsset(symbol);
  if (!base) return null;
  return COINGECKO_ID_MAP[base] ?? null;
}

const NEWS_KEYWORDS_BY_BASE: Record<string, string[]> = {
  BTC: ["BTC", "Bitcoin"],
  ETH: ["ETH", "Ethereum", "Ether"],
  SOL: ["SOL", "Solana"],
  BNB: ["BNB", "Binance Coin"],
  XRP: ["XRP", "Ripple"],
  ADA: ["ADA", "Cardano"],
  DOGE: ["DOGE", "Dogecoin"],
  AVAX: ["AVAX", "Avalanche"],
  DOT: ["DOT", "Polkadot"],
  TRX: ["TRX", "Tron"],
  MATIC: ["MATIC", "Polygon"],
  LINK: ["LINK", "Chainlink"],
  LTC: ["LTC", "Litecoin"],
  ATOM: ["ATOM", "Cosmos"],
  TON: ["TON", "Toncoin"],
  SUI: ["SUI"],
  PEPE: ["PEPE"],
  SHIB: ["SHIB", "Shiba"],
};

/** News keywords for a crypto symbol — base symbol + common name(s). */
export function getCryptoNewsKeywords(symbol: string): string[] {
  const base = getBaseAsset(symbol);
  if (!base) return [];
  return NEWS_KEYWORDS_BY_BASE[base] ?? [base];
}
