export type EventCategory = "employment" | "inflation" | "fed" | "gdp" | "other";
export type EventStatus = "upcoming" | "published";
export type SurpriseDirection = "above" | "below" | "inline";

export interface EconEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  dateEnd?: string;
  status: EventStatus;
  previous?: string;
  expected?: string;
  watchPoints?: string[];
  actual?: string;
  surprise?: SurpriseDirection;
  marketReaction?: string;
  analysis?: string;
}

export interface MonthlySummary {
  text: string;
  portfolioReview: string;
  nextMonthPreview: string;
}

export interface EconCalendarMonth {
  month: string;
  updatedAt: string;
  rateOutlook?: {
    holdProbability: number;
    cutProbability: number;
    source: string;
  };
  summary?: MonthlySummary;
  events: EconEvent[];
}
