import { getSmallCapCandidates, parkinsonVol } from '@/lib/yahoo'
import { getEarningsCalendar, getStockNews, detectCatalysts } from '@/lib/fmp'
import { calcScore } from '@/lib/scoring'
import type { StockData, Catalyst, EarningsInfo } from '@/lib/types'

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  const now = new Date()
  const todayStr = isoDate(now)
  const nextWeekStr = isoDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))

  const [candidates, earningsCalendar] = await Promise.all([
    getSmallCapCandidates(),
    getEarningsCalendar(todayStr, nextWeekStr),
  ])

  if (!candidates.length) {
    return Response.json(
      { error: 'No data available — market may be closed or screener unavailable' },
      { status: 503 }
    )
  }

  const earningsMap = new Map<string, string>()
  for (const e of earningsCalendar) {
    earningsMap.set(e.symbol.toUpperCase(), e.date)
  }

  // Preliminary rank by |change%| + relVol to pick top 50 for news API
  const withPrelim = candidates.map((q) => {
    const relVol =
      (q.regularMarketVolume ?? 0) /
      Math.max(q.averageVolume ?? q.averageDailyVolume10Day ?? 1, 1)
    const absChange = Math.abs(q.regularMarketChangePercent ?? 0)
    return { q, relVol, prelim: absChange * 0.6 + relVol * 0.4 }
  })
  withPrelim.sort((a, b) => b.prelim - a.prelim)
  const top50 = withPrelim.slice(0, 50)

  const newsItems = await getStockNews(top50.map((x) => x.q.symbol))
  const newsBySymbol = new Map<string, typeof newsItems>()
  for (const item of newsItems) {
    const sym = item.symbol.toUpperCase()
    if (!newsBySymbol.has(sym)) newsBySymbol.set(sym, [])
    newsBySymbol.get(sym)!.push(item)
  }

  const scored: StockData[] = top50.map(({ q, relVol }) => {
    const hv = parkinsonVol(q.fiftyTwoWeekHigh, q.fiftyTwoWeekLow)
    const symNews = newsBySymbol.get(q.symbol.toUpperCase()) ?? []
    const catalysts: Catalyst[] = detectCatalysts(symNews)

    let upcomingEarnings: EarningsInfo | undefined
    const earningsDate = earningsMap.get(q.symbol.toUpperCase())
    if (earningsDate) {
      const daysAway = daysBetween(now, new Date(earningsDate + 'T16:00:00'))
      if (daysAway >= 0 && daysAway <= 7) {
        upcomingEarnings = { date: earningsDate, daysAway }
        if (daysAway === 0) {
          catalysts.unshift({ type: 'EARNINGS_TODAY', label: 'Earnings Today' })
        } else {
          catalysts.unshift({
            type: 'EARNINGS_SOON',
            label: `Earnings in ${daysAway}d`,
          })
        }
      }
    }

    const score = calcScore({
      dayChangePct: q.regularMarketChangePercent ?? 0,
      relativeVolume: relVol,
      historicalVol: hv,
      catalysts,
    })

    const cleanName = (q.shortName ?? q.longName ?? q.symbol)
      .replace(/,?\s*(Inc\.?|Corp\.?|LLC\.?|Ltd\.?|Co\.?|Holdings?\.?)$/i, '')
      .trim()

    return {
      rank: 0,
      ticker: q.symbol,
      name: cleanName,
      price: q.regularMarketPrice ?? 0,
      dayChangePct: q.regularMarketChangePercent ?? 0,
      dayChangeAbs: q.regularMarketChange ?? 0,
      volume: q.regularMarketVolume ?? 0,
      avgVolume: q.averageVolume ?? q.averageDailyVolume10Day ?? 0,
      relativeVolume: Math.round(relVol * 10) / 10,
      marketCap: q.marketCap ?? 0,
      historicalVol: hv,
      beta: q.beta ?? 1,
      score,
      catalysts,
      upcomingEarnings,
      lastUpdated: now.toISOString(),
    }
  })

  const ranked = scored
    .sort((a, b) => {
      if (b.score.total !== a.score.total) return b.score.total - a.score.total
      const absA = Math.abs(a.dayChangePct)
      const absB = Math.abs(b.dayChangePct)
      if (absB !== absA) return absB - absA
      return b.relativeVolume - a.relativeVolume
    })
    .slice(0, 20)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  return Response.json({
    stocks: ranked,
    generatedAt: now.toISOString(),
    count: ranked.length,
  })
}
