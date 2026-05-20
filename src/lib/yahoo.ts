import YahooFinance from 'yahoo-finance2'
import type { ScreenerQuote, ScreenerResult } from 'yahoo-finance2/modules/screener'

// v3 API: default export is the class, must instantiate
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export type { ScreenerQuote }

const SMALL_CAP_MIN = 50_000_000
const SMALL_CAP_MAX = 3_000_000_000

// Parkinson's estimator: annualized vol from 52W high/low range
export function parkinsonVol(high52: number | undefined, low52: number | undefined): number {
  if (!high52 || !low52 || high52 <= low52) return 60
  return Math.round((Math.log(high52 / low52) / (2 * Math.sqrt(Math.log(2)))) * 100)
}

export async function getSmallCapCandidates(): Promise<ScreenerQuote[]> {
  const results = await Promise.allSettled<ScreenerResult>([
    yf.screener({ scrIds: 'small_cap_gainers', count: 100 }),
    yf.screener({ scrIds: 'most_actives', count: 100 }),
    yf.screener({ scrIds: 'day_losers', count: 100 }),
    yf.screener({ scrIds: 'aggressive_small_caps', count: 100 }),
  ])

  const seen = new Set<string>()
  const all: ScreenerQuote[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const q of r.value.quotes) {
      if (!q.symbol || seen.has(q.symbol)) continue
      seen.add(q.symbol)
      all.push(q)
    }
  }

  return all.filter((q) => {
    const mc = q.marketCap ?? 0
    return mc >= SMALL_CAP_MIN && mc <= SMALL_CAP_MAX
  })
}
