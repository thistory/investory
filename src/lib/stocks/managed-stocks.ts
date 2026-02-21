import fs from "fs";
import path from "path";
import { cache } from "@/lib/cache/redis";
import { getStockProfile } from "@/lib/services/providers/finnhub";

const REDIS_KEY = "investory:managed-stocks";
const STOCKS_FILE = path.join(process.cwd(), "data/stocks/managed-stocks.json");

export interface ManagedStock {
  symbol: string;
  name: string;
  tag: string;
  logo: string;
  addedAt: string;
}

/** 파일에서 종목 리스트 로드 */
function loadFromFile(): ManagedStock[] {
  try {
    if (!fs.existsSync(STOCKS_FILE)) return [];
    const content = fs.readFileSync(STOCKS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 파일에 종목 리스트 저장 */
function saveToFile(stocks: ManagedStock[]): void {
  try {
    const dir = path.dirname(STOCKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save managed stocks to file:", err);
  }
}

/**
 * 종목 리스트 조회
 * 우선순위: Redis/메모리 캐시 → 파일 → 빈 배열
 */
export async function getManagedStocks(): Promise<ManagedStock[]> {
  // 1. Redis/메모리 캐시
  const cached = await cache.get<ManagedStock[]>(REDIS_KEY);
  if (cached && cached.length > 0) {
    return cached;
  }

  // 2. 파일
  const fromFile = loadFromFile();
  if (fromFile.length > 0) {
    // 파일에서 읽은 데이터를 캐시에 올려놓기
    await cache.set(REDIS_KEY, fromFile);
    return fromFile;
  }

  return [];
}

/**
 * 종목 추가
 * Redis/메모리 캐시 + 파일 동시 저장
 */
export async function addStock(symbol: string): Promise<{ success: true; stock: ManagedStock } | { success: false; error: string }> {
  const upper = symbol.toUpperCase().trim();

  if (!/^[A-Z]{1,10}$/.test(upper)) {
    return { success: false, error: "유효하지 않은 심볼입니다" };
  }

  const current = await getManagedStocks();
  if (current.some((s) => s.symbol === upper)) {
    return { success: false, error: "이미 추가된 종목입니다" };
  }

  let name: string;
  let logo: string;
  let tag: string;
  try {
    const profile = await getStockProfile(upper);
    if (!profile.name) {
      return { success: false, error: "종목 정보를 찾을 수 없습니다" };
    }
    name = profile.name;
    logo = profile.logo || `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${upper}.png`;
    tag = profile.industry || "Stock";
  } catch {
    return { success: false, error: "종목 정보 조회에 실패했습니다" };
  }

  const newStock: ManagedStock = {
    symbol: upper,
    name,
    tag,
    logo,
    addedAt: new Date().toISOString().split("T")[0],
  };

  const updated = [...current, newStock];

  // 캐시 + 파일 동시 저장
  await cache.set(REDIS_KEY, updated);
  saveToFile(updated);

  return { success: true, stock: newStock };
}
