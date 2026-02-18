---
name: trading-analysis
description: 스윙 트레이딩 분석 지식. 기술적 지표(RSI, MACD, 볼린저밴드), 밸류에이션 지표(PER, PBR, PEG), 매크로 지표(금리, VIX) 해석 및 활용법. 트레이딩 로직 구현 시 자동 적용.
---

# Swing Trading Analysis Knowledge

## Technical Indicators

### RSI (Relative Strength Index)
- **Range**: 0-100
- **Oversold**: < 30 (potential buy)
- **Overbought**: > 70 (potential sell)
- **Sweet spot for swing**: 40-60 entering trend

```typescript
function interpretRSI(rsi: number): Signal {
  if (rsi < 30) return { signal: 'buy', strength: 'strong' };
  if (rsi < 40) return { signal: 'buy', strength: 'moderate' };
  if (rsi > 70) return { signal: 'sell', strength: 'strong' };
  if (rsi > 60) return { signal: 'sell', strength: 'moderate' };
  return { signal: 'hold', strength: 'neutral' };
}
```

### MACD (Moving Average Convergence Divergence)
- **Bullish**: MACD crosses above signal line
- **Bearish**: MACD crosses below signal line
- **Histogram**: Momentum strength indicator

### Moving Averages
- **20 MA**: Short-term trend (swing trading)
- **50 MA**: Medium-term trend
- **200 MA**: Long-term trend (bull/bear market)

```
Price > 20MA > 50MA > 200MA = Strong uptrend
Price < 20MA < 50MA < 200MA = Strong downtrend
```

### Bollinger Bands
- **Upper band touch**: Potential resistance
- **Lower band touch**: Potential support
- **Band squeeze**: Volatility expansion coming

---

## Valuation Metrics

### P/E Ratio (Price to Earnings)
| Range | Interpretation |
|-------|----------------|
| < 10 | Potentially undervalued (or troubled) |
| 10-20 | Fair value |
| 20-30 | Growth premium |
| > 30 | Expensive or high growth |

### P/S Ratio (Price to Sales)
- Useful for unprofitable growth companies
- < 2: Generally attractive
- > 10: Very expensive

### PEG Ratio (P/E to Growth)
- < 1: Undervalued relative to growth
- 1: Fairly valued
- > 2: Expensive relative to growth

### EV/EBITDA
- < 10: Potentially undervalued
- 10-15: Fair value
- > 15: Premium valuation

---

## Macro Indicators

### Interest Rates
- **Rising rates**: Generally negative for growth stocks
- **Falling rates**: Generally positive for equities
- **Yield curve inversion**: Recession warning

### VIX (Fear Index)
| Level | Market Sentiment |
|-------|------------------|
| < 15 | Complacency |
| 15-20 | Normal |
| 20-30 | Elevated fear |
| > 30 | Panic |

### Fear & Greed Index
- 0-25: Extreme Fear (contrarian buy)
- 25-45: Fear
- 45-55: Neutral
- 55-75: Greed
- 75-100: Extreme Greed (contrarian sell)

---

## Swing Trading Scoring Formula

```typescript
function calculateSwingScore(stock: StockData): number {
  const weights = {
    valuation: 0.25,
    momentum: 0.30,
    growth: 0.25,
    volume: 0.20
  };

  const valuationScore = scoreValuation(stock.pe, stock.ps, stock.peg);
  const momentumScore = scoreMomentum(stock.rsi, stock.macd, stock.priceVsMA);
  const growthScore = scoreGrowth(stock.revenueGrowth, stock.epsGrowth);
  const volumeScore = scoreVolume(stock.volumeRatio, stock.avgVolume);

  return (
    valuationScore * weights.valuation +
    momentumScore * weights.momentum +
    growthScore * weights.growth +
    volumeScore * weights.volume
  );
}
```

---

## Signal Generation Rules

### Buy Signal (🟢)
- RSI < 40 AND rising
- Price above 50MA
- MACD bullish crossover
- Volume > 1.5x average
- Score > 70

### Hold Signal (🟡)
- RSI 40-60
- No clear trend
- Score 40-70

### Sell Signal (🔴)
- RSI > 60 AND falling
- Price below 50MA
- MACD bearish crossover
- Score < 40
