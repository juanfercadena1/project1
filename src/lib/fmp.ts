import type { Catalyst, CatalystType } from './types'

const FMP_BASE = 'https://financialmodelingprep.com/api/v3'

export interface FmpEarningsItem {
  date: string
  symbol: string
  eps?: number
  epsEstimated?: number
  time?: string
}

interface FmpNewsItem {
  symbol: string
  title: string
  publishedDate: string
  site?: string
  text?: string
}

async function fmpFetch<T>(path: string): Promise<T | null> {
  const key = process.env.FMP_API_KEY
  if (!key) return null
  try {
    const res = await fetch(`${FMP_BASE}${path}&apikey=${key}`)
    if (!res.ok) return null
    const data = await res.json()
    return data as T
  } catch {
    return null
  }
}

export async function getEarningsCalendar(from: string, to: string): Promise<FmpEarningsItem[]> {
  return (await fmpFetch<FmpEarningsItem[]>(`/earning_calendar?from=${from}&to=${to}`)) ?? []
}

export async function getStockNews(tickers: string[]): Promise<FmpNewsItem[]> {
  if (!tickers.length) return []
  const t = tickers.slice(0, 15).join(',')
  return (await fmpFetch<FmpNewsItem[]>(`/stock_news?tickers=${t}&limit=60`)) ?? []
}

const CATALYST_PATTERNS: { type: CatalystType; label: string; keywords: string[] }[] = [
  {
    type: 'FDA',
    label: 'FDA',
    keywords: ['fda', 'approval', 'approved', 'nda', 'bla', 'pdufa', 'clinical trial', 'phase 3', 'phase iii'],
  },
  {
    type: 'MA',
    label: 'M&A',
    keywords: ['merger', 'acquisition', 'acquires', 'acquired', 'takeover', 'buyout', 'deal closed'],
  },
  {
    type: 'ANALYST_UPGRADE',
    label: 'Upgrade',
    keywords: ['upgrade', 'strong buy', 'outperform', 'overweight', 'buy rating', 'price target raised'],
  },
  {
    type: 'ANALYST_DOWNGRADE',
    label: 'Downgrade',
    keywords: ['downgrade', 'underperform', 'underweight', 'sell rating', 'reduce', 'price target cut'],
  },
  {
    type: 'PARTNERSHIP',
    label: 'Partnership',
    keywords: ['partnership', 'collaboration', 'alliance', 'agreement', 'joint venture', 'licensing deal'],
  },
  {
    type: 'PRODUCT_LAUNCH',
    label: 'Launch',
    keywords: ['launches', 'new product', 'new service', 'unveils', 'introduced', 'announced product'],
  },
]

export function detectCatalysts(newsItems: FmpNewsItem[]): Catalyst[] {
  const result: Catalyst[] = []
  const seen = new Set<CatalystType>()

  for (const item of newsItems) {
    const text = (item.title + ' ' + (item.text ?? '')).toLowerCase()
    for (const pattern of CATALYST_PATTERNS) {
      if (!seen.has(pattern.type) && pattern.keywords.some((k) => text.includes(k))) {
        result.push({ type: pattern.type, label: pattern.label, detail: item.title })
        seen.add(pattern.type)
      }
    }
  }

  return result
}
