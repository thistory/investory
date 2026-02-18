/**
 * Scoring System Types
 *
 * Quality (30%) | Moat (25%) | Value (20%) | Growth (15%) | Momentum (10%)
 */

export type InvestmentGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type InsightType = 'positive' | 'warning' | 'negative';

export interface Insight {
  type: InsightType;
  message: string;
  score?: number;
}

// --- Input Data ---

export interface QualityInput {
  roe: number | null;
  roa: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quarterlyRevenueGrowthYoY: number | null;
  quarterlyEarningsGrowthYoY: number | null;
}

export interface MoatInput {
  grossMargin: number | null;
  operatingMargin: number | null;
  marketCap: number | null;
  beta: number | null;
  roe: number | null;
  roa: number | null;
}

export interface ValueInput {
  peRatio: number | null;
  pegRatio: number | null;
  pbRatio: number | null;
  psRatio: number | null;
  evToEbitda: number | null;
  evToRevenue: number | null;
  currentPrice: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  sector: string | null;
}

export interface GrowthInput {
  quarterlyRevenueGrowthYoY: number | null;
  quarterlyEarningsGrowthYoY: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  analystTargetPrice: number | null;
  currentPrice: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
}

export interface MomentumInput {
  currentPrice: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  currentVolume: number | null;
  averageVolume: number | null;
}

// --- Score Results ---

export interface QualityScore {
  total: number;
  profitability: number;
  financialHealth: number;
  growthConsistency: number;
  insights: Insight[];
}

export interface MoatScore {
  total: number;
  pricingPower: number;
  marketPosition: number;
  durability: number;
  moatClassification: 'Wide' | 'Narrow' | 'None';
  insights: Insight[];
}

export interface ValueScore {
  total: number;
  valuationMultiples: number;
  pricePosition: number;
  marginOfSafety: number;
  insights: Insight[];
}

export interface GrowthScore {
  total: number;
  historicalGrowth: number;
  analystExpectations: number;
  growthQuality: number;
  insights: Insight[];
}

export interface MomentumScore {
  total: number;
  trend: number;
  indicators: number;
  volume: number;
  insights: Insight[];
}

export interface CompositeScore {
  totalScore: number;
  grade: InvestmentGrade;
  quality: QualityScore;
  moat: MoatScore;
  value: ValueScore;
  growth: GrowthScore;
  momentum: MomentumScore;
  insights: Insight[];
  calculatedAt: Date;
  symbol: string;
}

// --- Sector Averages ---

export interface SectorAverages {
  pe: number;
  pb: number;
  ps: number;
  evToEbitda: number;
  roe: number;
  roa: number;
  grossMargin: number;
  netMargin: number;
}

export const SECTOR_AVERAGES: Record<string, SectorAverages> = {
  'Technology':             { pe: 30, pb: 6,   ps: 5,   evToEbitda: 20, roe: 18, roa: 10, grossMargin: 60, netMargin: 20 },
  'Consumer Cyclical':      { pe: 20, pb: 3,   ps: 1.5, evToEbitda: 12, roe: 15, roa: 8,  grossMargin: 40, netMargin: 8 },
  'Healthcare':             { pe: 25, pb: 4,   ps: 3,   evToEbitda: 15, roe: 16, roa: 9,  grossMargin: 70, netMargin: 15 },
  'Financial Services':     { pe: 15, pb: 1.5, ps: 2,   evToEbitda: 10, roe: 12, roa: 1.5,grossMargin: 50, netMargin: 20 },
  'Industrials':            { pe: 18, pb: 2.5, ps: 1.2, evToEbitda: 12, roe: 14, roa: 7,  grossMargin: 30, netMargin: 8 },
  'Energy':                 { pe: 12, pb: 1.8, ps: 0.8, evToEbitda: 8,  roe: 10, roa: 6,  grossMargin: 40, netMargin: 10 },
  'Consumer Defensive':     { pe: 22, pb: 4,   ps: 0.8, evToEbitda: 14, roe: 18, roa: 8,  grossMargin: 35, netMargin: 6 },
  'Utilities':              { pe: 18, pb: 1.6, ps: 2,   evToEbitda: 10, roe: 9,  roa: 3,  grossMargin: 40, netMargin: 12 },
  'Communication Services': { pe: 20, pb: 3,   ps: 2.5, evToEbitda: 12, roe: 15, roa: 8,  grossMargin: 55, netMargin: 15 },
  'Real Estate':            { pe: 35, pb: 2,   ps: 8,   evToEbitda: 18, roe: 8,  roa: 4,  grossMargin: 60, netMargin: 25 },
  'Basic Materials':        { pe: 15, pb: 1.8, ps: 1,   evToEbitda: 9,  roe: 12, roa: 6,  grossMargin: 25, netMargin: 10 },
  'Default':                { pe: 20, pb: 3,   ps: 2,   evToEbitda: 12, roe: 15, roa: 7,  grossMargin: 40, netMargin: 10 },
};

// --- Utility Functions ---

export function scoreToGrade(score: number): InvestmentGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function safeNumber(value: number | null | undefined, defaultValue: number = 0): number {
  return value ?? defaultValue;
}

export function percentToNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}
