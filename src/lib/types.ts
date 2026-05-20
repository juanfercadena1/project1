export type CatalystType =
  | 'EARNINGS_TODAY'
  | 'EARNINGS_SOON'
  | 'FDA'
  | 'MA'
  | 'ANALYST_UPGRADE'
  | 'ANALYST_DOWNGRADE'
  | 'PARTNERSHIP'
  | 'PRODUCT_LAUNCH'

export interface Catalyst {
  type: CatalystType
  label: string
  detail?: string
}

export interface EarningsInfo {
  date: string
  daysAway: number
}

export interface ScoreBreakdown {
  priceChange: number
  volume: number
  volatility: number
  catalyst: number
  total: number
}

export interface StockData {
  rank: number
  ticker: string
  name: string
  price: number
  dayChangePct: number
  dayChangeAbs: number
  volume: number
  avgVolume: number
  relativeVolume: number
  marketCap: number
  historicalVol: number
  score: ScoreBreakdown
  catalysts: Catalyst[]
  upcomingEarnings?: EarningsInfo
  lastUpdated: string
}

export interface ScannerResult {
  stocks: StockData[]
  generatedAt: string
  count: number
  error?: string
}
