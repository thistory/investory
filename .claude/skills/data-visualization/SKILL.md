---
name: data-visualization
description: 금융 데이터 시각화 전문 지식. 차트 라이브러리(TradingView, Recharts), 히트맵, 스코어카드, 대시보드 레이아웃 설계. UI 컴포넌트 구현 시 자동 적용.
---

# Financial Data Visualization Guide

## Chart Libraries

### TradingView Lightweight Charts
Primary choice for price charts.

```typescript
import { createChart } from 'lightweight-charts';

const chart = createChart(container, {
  width: 800,
  height: 400,
  layout: {
    background: { color: '#1a1a2e' },
    textColor: '#d1d5db',
  },
  grid: {
    vertLines: { color: '#2d2d44' },
    horzLines: { color: '#2d2d44' },
  },
});

const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#22c55e',
  downColor: '#ef4444',
  borderVisible: false,
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
});
```

### Recharts
For custom visualizations (radar charts, heatmaps).

```tsx
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

<RadarChart data={scoreData}>
  <PolarGrid stroke="#374151" />
  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af' }} />
  <Radar
    dataKey="score"
    stroke="#3b82f6"
    fill="#3b82f6"
    fillOpacity={0.5}
  />
</RadarChart>
```

---

## Color System

### Signal Colors
```css
:root {
  --signal-buy: #22c55e;      /* Green */
  --signal-hold: #eab308;     /* Yellow */
  --signal-sell: #ef4444;     /* Red */

  --trend-up: #22c55e;
  --trend-down: #ef4444;
  --trend-neutral: #6b7280;
}
```

### Heatmap Gradients
```typescript
// For percentage changes
function getHeatmapColor(value: number): string {
  if (value >= 5) return '#15803d';  // Dark green
  if (value >= 2) return '#22c55e';  // Green
  if (value >= 0) return '#86efac';  // Light green
  if (value >= -2) return '#fca5a5'; // Light red
  if (value >= -5) return '#ef4444'; // Red
  return '#b91c1c';                   // Dark red
}
```

### Score Visualization
```typescript
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';  // Excellent
  if (score >= 60) return '#84cc16';  // Good
  if (score >= 40) return '#eab308';  // Fair
  if (score >= 20) return '#f97316';  // Poor
  return '#ef4444';                    // Very poor
}
```

---

## Dashboard Layouts

### Main Dashboard Grid
```
┌────────────────────────────────────────────────────────┐
│ Header: Market Status | Last Update | Search          │
├────────────┬───────────────────────────────────────────┤
│            │                                           │
│  Sidebar   │         Main Content Area                │
│            │                                           │
│ - Watchlist│  ┌─────────────────────────────────────┐ │
│ - Filters  │  │       Chart / Screener Results      │ │
│ - Presets  │  │                                     │ │
│            │  └─────────────────────────────────────┘ │
│            │                                           │
│            │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│            │  │ Card 1   │ │ Card 2   │ │ Card 3   │ │
│            │  │ Macro    │ │ Sector   │ │ News     │ │
│            │  └──────────┘ └──────────┘ └──────────┘ │
└────────────┴───────────────────────────────────────────┘
```

### Stock Detail Layout
```
┌────────────────────────────────────────────────────────┐
│ AAPL Apple Inc.     $185.92  +2.34 (+1.27%)   🟢 BUY  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │              Price Chart (TradingView)           │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │ Score Card │ │ Valuation  │ │    Key Metrics     │ │
│  │            │ │            │ │                    │ │
│  │  ████ 78   │ │ P/E: 28.5  │ │ RSI: 45           │ │
│  │  Radar     │ │ P/S: 7.2   │ │ 52W High: -8%     │ │
│  │  Chart     │ │ PEG: 2.1   │ │ Avg Vol: 52M      │ │
│  └────────────┘ └────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## Component Patterns

### Score Badge
```tsx
function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <div className={`px-3 py-1 rounded-full font-bold`}
         style={{ backgroundColor: color }}>
      {score}/100
    </div>
  );
}
```

### Signal Indicator
```tsx
function SignalIndicator({ signal }: { signal: 'buy' | 'hold' | 'sell' }) {
  const config = {
    buy: { color: 'bg-green-500', icon: '🟢', text: 'BUY' },
    hold: { color: 'bg-yellow-500', icon: '🟡', text: 'HOLD' },
    sell: { color: 'bg-red-500', icon: '🔴', text: 'SELL' },
  };

  return (
    <span className={`${config[signal].color} px-2 py-1 rounded`}>
      {config[signal].icon} {config[signal].text}
    </span>
  );
}
```

### Metric Card
```tsx
function MetricCard({ label, value, change }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{change}%
      </div>
    </div>
  );
}
```

---

## Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '640px',   // Single column
  tablet: '768px',   // 2 columns
  desktop: '1024px', // 3 columns
  wide: '1280px',    // Full layout
};
```

## Animation Guidelines

- Use subtle transitions (150-300ms)
- Animate number changes with counting effect
- Chart updates should be smooth, not jarring
- Loading states with skeleton screens
