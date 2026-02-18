import axios, { AxiosInstance } from "axios";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

interface AlphaVantageTimeSeries {
  "Meta Data": {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
    "4. Output Size": string;
    "5. Time Zone": string;
  };
  "Time Series (Daily)": {
    [date: string]: {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    };
  };
}

interface AlphaVantageRSI {
  "Meta Data": {
    "1. Symbol": string;
    "2. Indicator": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5. Time Period": number;
    "6. Series Type": string;
    "7. Time Zone": string;
  };
  "Technical Analysis: RSI": {
    [date: string]: {
      RSI: string;
    };
  };
}

interface AlphaVantageMACD {
  "Meta Data": {
    "1. Symbol": string;
    "2. Indicator": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5.1. Fast Period": number;
    "5.2. Slow Period": number;
    "5.3. Signal Period": number;
    "6. Series Type": string;
    "7. Time Zone": string;
  };
  "Technical Analysis: MACD": {
    [date: string]: {
      MACD: string;
      MACD_Signal: string;
      MACD_Hist: string;
    };
  };
}

interface AlphaVantageSMA {
  "Meta Data": {
    "1. Symbol": string;
    "2. Indicator": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5. Time Period": number;
    "6. Series Type": string;
    "7. Time Zone": string;
  };
  "Technical Analysis: SMA": {
    [date: string]: {
      SMA: string;
    };
  };
}

interface AlphaVantageBBands {
  "Meta Data": {
    "1. Symbol": string;
    "2. Indicator": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5. Time Period": number;
    "6. Deviation multiplier for upper band": number;
    "7. Deviation multiplier for lower band": number;
    "8. MA Type": number;
    "9. Series Type": string;
    "10. Time Zone": string;
  };
  "Technical Analysis: BBANDS": {
    [date: string]: {
      "Real Upper Band": string;
      "Real Middle Band": string;
      "Real Lower Band": string;
    };
  };
}

interface AlphaVantageOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  AnalystRatingStrongBuy: string;
  AnalystRatingBuy: string;
  AnalystRatingHold: string;
  AnalystRatingSell: string;
  AnalystRatingStrongSell: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

interface AlphaVantageIncomeStatement {
  symbol: string;
  annualReports: Array<{
    fiscalDateEnding: string;
    reportedCurrency: string;
    totalRevenue: string;
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
    ebitda: string;
  }>;
  quarterlyReports: Array<{
    fiscalDateEnding: string;
    reportedCurrency: string;
    totalRevenue: string;
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
    ebitda: string;
  }>;
}

class AlphaVantageClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || "";

    this.client = axios.create({
      baseURL: ALPHA_VANTAGE_BASE_URL,
      timeout: 30000,
    });
  }

  async getDailyTimeSeries(
    symbol: string,
    outputSize: "compact" | "full" = "compact"
  ): Promise<AlphaVantageTimeSeries> {
    const response = await this.client.get<AlphaVantageTimeSeries>("", {
      params: {
        function: "TIME_SERIES_DAILY",
        symbol: symbol.toUpperCase(),
        outputsize: outputSize,
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getRSI(
    symbol: string,
    interval: string = "daily",
    timePeriod: number = 14
  ): Promise<AlphaVantageRSI> {
    const response = await this.client.get<AlphaVantageRSI>("", {
      params: {
        function: "RSI",
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: "close",
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getMACD(
    symbol: string,
    interval: string = "daily"
  ): Promise<AlphaVantageMACD> {
    const response = await this.client.get<AlphaVantageMACD>("", {
      params: {
        function: "MACD",
        symbol: symbol.toUpperCase(),
        interval,
        series_type: "close",
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getSMA(
    symbol: string,
    interval: string = "daily",
    timePeriod: number = 20
  ): Promise<AlphaVantageSMA> {
    const response = await this.client.get<AlphaVantageSMA>("", {
      params: {
        function: "SMA",
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: "close",
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getBBands(
    symbol: string,
    interval: string = "daily",
    timePeriod: number = 20
  ): Promise<AlphaVantageBBands> {
    const response = await this.client.get<AlphaVantageBBands>("", {
      params: {
        function: "BBANDS",
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: "close",
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getCompanyOverview(symbol: string): Promise<AlphaVantageOverview> {
    const response = await this.client.get<AlphaVantageOverview>("", {
      params: {
        function: "OVERVIEW",
        symbol: symbol.toUpperCase(),
        apikey: this.apiKey,
      },
    });
    return response.data;
  }

  async getIncomeStatement(symbol: string): Promise<AlphaVantageIncomeStatement> {
    const response = await this.client.get<AlphaVantageIncomeStatement>("", {
      params: {
        function: "INCOME_STATEMENT",
        symbol: symbol.toUpperCase(),
        apikey: this.apiKey,
      },
    });
    return response.data;
  }
}

export const alphaVantageClient = new AlphaVantageClient();

// Helper functions for formatted data
export async function getDailyPrices(symbol: string, full: boolean = false) {
  const data = await alphaVantageClient.getDailyTimeSeries(
    symbol,
    full ? "full" : "compact"
  );

  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) {
    return [];
  }

  return Object.entries(timeSeries)
    .map(([date, values]) => ({
      date: new Date(date),
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseInt(values["5. volume"], 10),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getTechnicalIndicators(symbol: string) {
  const [rsiData, macdData, sma20Data, sma50Data, sma200Data, bbandsData] =
    await Promise.all([
      alphaVantageClient.getRSI(symbol, "daily", 14),
      alphaVantageClient.getMACD(symbol, "daily"),
      alphaVantageClient.getSMA(symbol, "daily", 20),
      alphaVantageClient.getSMA(symbol, "daily", 50),
      alphaVantageClient.getSMA(symbol, "daily", 200),
      alphaVantageClient.getBBands(symbol, "daily", 20),
    ]);

  const latestRsiDate = Object.keys(rsiData["Technical Analysis: RSI"] || {})[0];
  const latestMacdDate = Object.keys(
    macdData["Technical Analysis: MACD"] || {}
  )[0];
  const latestSma20Date = Object.keys(
    sma20Data["Technical Analysis: SMA"] || {}
  )[0];
  const latestSma50Date = Object.keys(
    sma50Data["Technical Analysis: SMA"] || {}
  )[0];
  const latestSma200Date = Object.keys(
    sma200Data["Technical Analysis: SMA"] || {}
  )[0];
  const latestBbandsDate = Object.keys(
    bbandsData["Technical Analysis: BBANDS"] || {}
  )[0];

  const rsi = latestRsiDate
    ? parseFloat(rsiData["Technical Analysis: RSI"][latestRsiDate].RSI)
    : undefined;

  const macd = latestMacdDate
    ? {
        macd: parseFloat(
          macdData["Technical Analysis: MACD"][latestMacdDate].MACD
        ),
        signal: parseFloat(
          macdData["Technical Analysis: MACD"][latestMacdDate].MACD_Signal
        ),
        histogram: parseFloat(
          macdData["Technical Analysis: MACD"][latestMacdDate].MACD_Hist
        ),
      }
    : undefined;

  const sma20 = latestSma20Date
    ? parseFloat(sma20Data["Technical Analysis: SMA"][latestSma20Date].SMA)
    : undefined;

  const sma50 = latestSma50Date
    ? parseFloat(sma50Data["Technical Analysis: SMA"][latestSma50Date].SMA)
    : undefined;

  const sma200 = latestSma200Date
    ? parseFloat(sma200Data["Technical Analysis: SMA"][latestSma200Date].SMA)
    : undefined;

  const bbands = latestBbandsDate
    ? {
        upper: parseFloat(
          bbandsData["Technical Analysis: BBANDS"][latestBbandsDate][
            "Real Upper Band"
          ]
        ),
        middle: parseFloat(
          bbandsData["Technical Analysis: BBANDS"][latestBbandsDate][
            "Real Middle Band"
          ]
        ),
        lower: parseFloat(
          bbandsData["Technical Analysis: BBANDS"][latestBbandsDate][
            "Real Lower Band"
          ]
        ),
      }
    : undefined;

  return {
    symbol: symbol.toUpperCase(),
    date: latestRsiDate ? new Date(latestRsiDate) : new Date(),
    rsi14: rsi,
    macd,
    sma20,
    sma50,
    sma200,
    bollingerBands: bbands,
  };
}

export async function getIncomeStatements(symbol: string) {
  const data = await alphaVantageClient.getIncomeStatement(symbol);

  const parseReport = (report: {
    fiscalDateEnding: string;
    totalRevenue: string;
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
    ebitda: string;
  }) => ({
    date: report.fiscalDateEnding,
    revenue: parseFloat(report.totalRevenue) || 0,
    grossProfit: parseFloat(report.grossProfit) || 0,
    operatingIncome: parseFloat(report.operatingIncome) || 0,
    netIncome: parseFloat(report.netIncome) || 0,
    ebitda: parseFloat(report.ebitda) || 0,
  });

  return {
    annual: (data.annualReports || []).slice(0, 5).map(parseReport).reverse(),
    quarterly: (data.quarterlyReports || []).slice(0, 20).map(parseReport).reverse(),
  };
}

export async function getCompanyOverview(symbol: string) {
  const data = await alphaVantageClient.getCompanyOverview(symbol);

  return {
    symbol: data.Symbol,
    name: data.Name,
    description: data.Description,
    cik: data.CIK,
    exchange: data.Exchange,
    sector: data.Sector,
    industry: data.Industry,
    address: data.Address,
    fiscalYearEnd: data.FiscalYearEnd,
    latestQuarter: data.LatestQuarter,

    valuation: {
      marketCap: parseFloat(data.MarketCapitalization) || undefined,
      pe: parseFloat(data.PERatio) || undefined,
      peg: parseFloat(data.PEGRatio) || undefined,
      priceToBook: parseFloat(data.PriceToBookRatio) || undefined,
      priceToSales: parseFloat(data.PriceToSalesRatioTTM) || undefined,
      evToRevenue: parseFloat(data.EVToRevenue) || undefined,
      evToEbitda: parseFloat(data.EVToEBITDA) || undefined,
      forwardPE: parseFloat(data.ForwardPE) || undefined,
      trailingPE: parseFloat(data.TrailingPE) || undefined,
    },

    fundamentals: {
      eps: parseFloat(data.EPS) || undefined,
      dilutedEps: parseFloat(data.DilutedEPSTTM) || undefined,
      bookValue: parseFloat(data.BookValue) || undefined,
      revenuePerShare: parseFloat(data.RevenuePerShareTTM) || undefined,
      revenue: parseFloat(data.RevenueTTM) || undefined,
      grossProfit: parseFloat(data.GrossProfitTTM) || undefined,
      ebitda: parseFloat(data.EBITDA) || undefined,
    },

    margins: {
      profit: parseFloat(data.ProfitMargin) || undefined,
      operating: parseFloat(data.OperatingMarginTTM) || undefined,
    },

    returns: {
      roa: parseFloat(data.ReturnOnAssetsTTM) || undefined,
      roe: parseFloat(data.ReturnOnEquityTTM) || undefined,
    },

    growth: {
      quarterlyEarningsGrowth:
        parseFloat(data.QuarterlyEarningsGrowthYOY) || undefined,
      quarterlyRevenueGrowth:
        parseFloat(data.QuarterlyRevenueGrowthYOY) || undefined,
    },

    dividend: {
      perShare: parseFloat(data.DividendPerShare) || undefined,
      yield: parseFloat(data.DividendYield) || undefined,
      date: data.DividendDate || undefined,
      exDate: data.ExDividendDate || undefined,
    },

    technicals: {
      beta: parseFloat(data.Beta) || undefined,
      "52WeekHigh": parseFloat(data["52WeekHigh"]) || undefined,
      "52WeekLow": parseFloat(data["52WeekLow"]) || undefined,
      "50DayMA": parseFloat(data["50DayMovingAverage"]) || undefined,
      "200DayMA": parseFloat(data["200DayMovingAverage"]) || undefined,
    },

    shares: {
      outstanding: parseFloat(data.SharesOutstanding) || undefined,
    },

    analystRatings: {
      targetPrice: parseFloat(data.AnalystTargetPrice) || undefined,
      strongBuy: parseInt(data.AnalystRatingStrongBuy, 10) || 0,
      buy: parseInt(data.AnalystRatingBuy, 10) || 0,
      hold: parseInt(data.AnalystRatingHold, 10) || 0,
      sell: parseInt(data.AnalystRatingSell, 10) || 0,
      strongSell: parseInt(data.AnalystRatingStrongSell, 10) || 0,
    },
  };
}
