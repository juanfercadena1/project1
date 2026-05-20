import type { Catalyst, ScoreBreakdown } from './types'

export function calcPriceScore(dayChangePct: number): number {
  const abs = Math.abs(dayChangePct)
  if (abs >= 30) return 35
  if (abs >= 20) return 30 + (abs - 20) * 0.5
  if (abs >= 10) return 20 + (abs - 10) * 1.0
  if (abs >= 5) return 10 + (abs - 5) * 2.0
  return Math.min(abs * 2, 10)
}

export function calcVolumeScore(relVol: number): number {
  if (relVol >= 10) return 25
  if (relVol >= 5) return 20 + (relVol - 5)
  if (relVol >= 2) return 12 + ((relVol - 2) * 8) / 3
  if (relVol >= 1) return relVol * 12
  return 0
}

export function calcVolatilityScore(hvPct: number): number {
  if (hvPct >= 150) return 20
  if (hvPct >= 100) return 15 + (hvPct - 100) * 0.1
  if (hvPct >= 60) return 8 + ((hvPct - 60) * 7) / 40
  if (hvPct >= 30) return 2 + (hvPct - 30) * 0.2
  return (hvPct / 30) * 2
}

export function calcCatalystScore(catalysts: Catalyst[]): number {
  const weights: Partial<Record<string, number>> = {
    EARNINGS_TODAY: 20,
    EARNINGS_SOON: 12,
    FDA: 15,
    MA: 12,
    ANALYST_UPGRADE: 8,
    ANALYST_DOWNGRADE: 6,
    PARTNERSHIP: 5,
    PRODUCT_LAUNCH: 5,
  }
  const seen = new Set<string>()
  let score = 0
  for (const c of catalysts) {
    if (!seen.has(c.type)) {
      score += weights[c.type] ?? 3
      seen.add(c.type)
    }
  }
  return Math.min(score, 20)
}

export function calcScore(params: {
  dayChangePct: number
  relativeVolume: number
  historicalVol: number
  catalysts: Catalyst[]
}): ScoreBreakdown {
  const priceChange = Math.min(Math.round(calcPriceScore(params.dayChangePct)), 35)
  const volume = Math.min(Math.round(calcVolumeScore(params.relativeVolume)), 25)
  const volatility = Math.min(Math.round(calcVolatilityScore(params.historicalVol)), 20)
  const catalyst = Math.min(Math.round(calcCatalystScore(params.catalysts)), 20)
  return {
    priceChange,
    volume,
    volatility,
    catalyst,
    total: priceChange + volume + volatility + catalyst,
  }
}
