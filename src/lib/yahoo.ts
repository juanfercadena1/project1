import yahooFinance from 'yahoo-finance2'

const SMALL_CAP_MIN = 50_000_000
const SMALL_CAP_MAX = 3_000_000_000

export interface YahooQuote {
  symbol: string
  shortName?: string | null
  longName?: string | null
  regularMarketPrice?: number | null
  regularMarketChangePercent?: number | null
  regularMarketChange?: number | null
  regularMarketVolume?: number | null
  averageVolume?: number | null
  averageDailyVolume10Day?: number | null
  marketCap?: number | null
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  beta?: number | null
}

// Parkinson's range-based annual volatility estimator using 52-week high/low
export function parkinsonVol(high52: number | null | undefined, low52: number | null | undefined): number {
  if (!high52 || !low52 || high52 <= low52) return 60
  const twoSqrtLn2 = 2 * Math.sqrt(Math.log(2))
  return Math.round((Math.log(high52 / low52) / twoSqrtLn2) * 100)
}

export async function getSmallCapCandidates(): Promise<YahooQuote[]> {
  const presets = ['day_gainers', 'day_losers', 'most_actives'] as const

  const results = await Promise.allSettled(
    presets.map((scrId) =>
      yahooFinance.screener(
        { scrIds: scrId, count: 100 },
        { validateResult: false }
      )
    )
  )

  const seen = new Set<string>()
  const all: YahooQuote[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const quotes = (r.value as { quotes?: unknown[] }).quotes ?? []
    for (const q of quotes) {
      const quote = q as YahooQuote
      if (!quote.symbol || seen.has(quote.symbol)) continue
      seen.add(quote.symbol)
      all.push(quote)
    }
  }

  return all.filter((q) => {
    const mc = q.marketCap ?? 0
    return mc >= SMALL_CAP_MIN && mc <= SMALL_CAP_MAX
  })
}
