'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScannerResult } from '@/lib/types'
import { StockRow } from './StockRow'

const REFRESH_MS = 5 * 60 * 1000

function CountdownTimer({ targetMs }: { targetMs: number }) {
  const [remaining, setRemaining] = useState(targetMs)

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    setRemaining(targetMs)
  }, [targetMs])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return (
    <span className="font-mono text-xs text-gray-600">
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

export function Dashboard() {
  const [data, setData] = useState<ScannerResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [nextRefreshMs, setNextRefreshMs] = useState(REFRESH_MS)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scanner')
      const json: ScannerResult = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setData(json)
      setLastRefresh(new Date())
      setNextRefreshMs(REFRESH_MS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchData])

  const earningsToday = data?.stocks.filter((s) => s.upcomingEarnings?.daysAway === 0) ?? []
  const earningsSoon = data?.stocks.filter((s) => (s.upcomingEarnings?.daysAway ?? 99) > 0 && (s.upcomingEarnings?.daysAway ?? 99) <= 3) ?? []

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-10">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            Russell 2000 Volatility Scanner
          </h1>
          <p className="text-gray-600 text-xs">
            Top 20 most volatile small caps — $50M–$3B market cap
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <div className="text-right hidden sm:block">
              <div className="text-gray-500 text-xs">{lastRefresh.toLocaleTimeString()}</div>
              <div className="text-gray-600 text-xs flex items-center gap-1">
                next <CountdownTimer targetMs={nextRefreshMs} />
              </div>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-white disabled:opacity-40 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Earnings Today Banner */}
      {earningsToday.length > 0 && (
        <div className="bg-yellow-950/50 border-b border-yellow-800/40 px-4 py-2 flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-xs uppercase tracking-wide">Earnings Today</span>
          <div className="flex gap-2">
            {earningsToday.map((s) => (
              <span key={s.ticker} className="text-yellow-300 font-mono text-xs bg-yellow-900/50 px-2 py-0.5 rounded">
                {s.ticker}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Earnings This Week Banner */}
      {earningsSoon.length > 0 && (
        <div className="bg-yellow-950/20 border-b border-yellow-900/30 px-4 py-1.5 flex items-center gap-2">
          <span className="text-yellow-600 text-xs">Earnings 1–3 days:</span>
          <div className="flex gap-2 flex-wrap">
            {earningsSoon.map((s) => (
              <span key={s.ticker} className="text-yellow-700 font-mono text-xs">
                {s.ticker} ({s.upcomingEarnings?.daysAway}d)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score key legend */}
      <div className="px-4 py-2 border-b border-gray-800/50 hidden md:flex items-center gap-4 text-xs">
        <span className="text-gray-600">Score bars (max 100):</span>
        {[
          { label: 'Price Change', color: 'bg-orange-500', max: '35' },
          { label: 'Volume', color: 'bg-blue-500', max: '25' },
          { label: 'Volatility HV', color: 'bg-purple-500', max: '20' },
          { label: 'Catalyst', color: 'bg-yellow-500', max: '20' },
        ].map(({ label, color, max }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-gray-500">{label} ({max})</span>
          </div>
        ))}
        <span className="text-gray-600 ml-2">Click row for details</span>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="px-4 py-8 text-center">
          <div className="text-red-400 text-sm mb-1">{error}</div>
          <div className="text-gray-600 text-xs mb-3">
            Make sure the market is open. FMP_API_KEY optional for earnings/catalyst data.
          </div>
          <button onClick={fetchData} className="text-gray-400 text-xs underline">
            Try again
          </button>
        </div>
      )}

      {/* Loading placeholder */}
      {loading && !data && (
        <div className="px-4 py-12 text-center text-gray-600 text-sm">
          Scanning markets...
        </div>
      )}

      {/* Table */}
      {data && data.stocks.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-600 text-xs">
                <th className="px-3 py-2 text-center w-10">#</th>
                <th className="px-3 py-2 text-left">Ticker</th>
                <th className="px-3 py-2 text-right">Price / Chg</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Volume</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Catalysts</th>
                <th className="px-3 py-2 text-right hidden lg:table-cell">Mkt Cap</th>
              </tr>
            </thead>
            <tbody>
              {data.stocks.map((stock) => (
                <StockRow key={stock.ticker} stock={stock} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-gray-800/50 text-gray-700 text-xs flex justify-between mt-4">
        <span>Yahoo Finance (price/vol) · FMP (earnings/catalysts, optional)</span>
        <span>{data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ''}</span>
      </footer>
    </div>
  )
}
