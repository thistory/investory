export interface SnsPost {
  hook: string;   // 스크롤 멈추게 하는 한 줄 (50자 이내)
  text: string;   // 본문 (스토리 + 숫자 + CTA)
}

export interface SnsContent {
  x?: SnsPost;        // X(Twitter) 기본 양식 (280자 이내)
  threads: SnsPost;   // Threads용 — X 변형 (280자 이내)
  telegram: SnsPost;  // Telegram용 — X 변형 (500자 이내)
}

/** 인덱스용 경량 엔트리 — 카드 UI + 검색에 필요한 필드만 */
export interface AnalysisIndexEntry {
  symbol: string;
  companyName: string;
  analysisDate: string;
  currentPrice: number;
  marketCap: string;
  oneLiner: string;
  buyReasonTitles: string[];
  riskTitles: string[];
  highRiskCount: number;
  consensusTarget: number;
  upsidePercent: number;
  sourceCount: number;
}

export interface AnalysisSource {
  name: string;
  url: string;
  description: string;
}

export interface StockAnalysisReport {
  symbol: string;
  companyName: string;
  analysisDate: string;
  currentPrice: number;
  marketCap: string;

  businessSummary: {
    oneLiner: string;
    description: string;
    howTheyMakeMoney: string[];
    keyProducts: string[];
  };

  keyMetrics: {
    name: string;
    value: string;
    interpretation: string;
  }[];

  growthDrivers: {
    title: string;
    description: string;
  }[];

  competitiveAdvantage: {
    summary: string;
    moats: {
      type: string;
      description: string;
    }[];
    competitors: {
      name: string;
      detail: string;
    }[];
  };

  recentNews: {
    date: string;
    headline: string;
    significance: string;
    url?: string;
  }[];

  analystOpinions: {
    consensusTarget: number;
    highTarget: number;
    lowTarget: number;
    upsidePercent: number;
    buyCount: number;
    holdCount: number;
    sellCount: number;
    notableComment: string;
  };

  risks: {
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
  }[];

  buyReasons: {
    title: string;
    rationale: string;
  }[];

  technicalPosition: {
    week52High: number;
    week52Low: number;
    currentPositionPercent: number;
    sma50: number;
    sma50Signal: "above" | "below";
    sma200: number;
    sma200Signal: "above" | "below";
    rsi: number;
    rsiSignal: "oversold" | "overbought" | "neutral";
  };

  overallOpinion: string | string[];

  sources: AnalysisSource[];

  snsContent?: SnsContent;
}
