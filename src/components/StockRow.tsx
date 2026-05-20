'use client'

import { useState } from 'react'
import type { StockData } from '@/lib/types'
import { CatalystBadge } from './CatalystBadge'
import { ScoreMeter } from './ScoreMeter'

function fmtVol(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${Math.round(vol / 1_000)}K`
  return vol.toString()
}

function fmtMCap(mc: number): string {
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(1)}B`
  if (mc >= 1_000_000) return `$${Math.round(mc / 1_000_000)}M`
  return `$${mc}`
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function StockRow({ stock }: { stock: StockData }) {
  const [expanded, setExpanded] = useState(false)
  const up = stock.dayChangePct >= 0
  const changeColor = up ? 'text-green-400' : 'text-red-400'

  return (
    <>
      <tr
        className="border-b border-gray-800/60 hover:bg-gray-800/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Rank */}
        <td className="px-3 py-2.5 text-center w-10">
          <span className="text-gray-400 text-sm font-mono">
            {RANK_MEDALS[stock.rank] ?? stock.rank}
          </span>
        </td>

        {/* Ticker + Name */}
        <td className="px-3 py-2.5">
          <div className="font-mono font-bold text-white text-sm">{stock.ticker}</div>
          <div className="text-gray-500 text-xs truncate max-w-[130px]">{stock.name}</div>
        </td>

        {/* Price + Change */}
        <td className="px-3 py-2.5 text-right">
          <div className="text-white font-mono text-sm">${stock.price.toFixed(2)}</div>
          <div className={`font-mono text-xs font-semibold ${changeColor}`}>
            {up ? '+' : ''}{stock.dayChangePct.toFixed(2)}%
          </div>
        </td>

        {/* Volume */}
        <td className="px-3 py-2.5 text-right hidden sm:table-cell">
          <div className="text-white text-sm">{fmtVol(stock.volume)}</div>
          <div className="text-gray-500 text-xs">{stock.relativeVolume}x avg</div>
        </td>

        {/* Score */}
        <td className="px-3 py-2.5">
          <ScoreMeter score={stock.score} />
        </td>

        {/* Catalysts */}
        <td className="px-3 py-2.5 hidden md:table-cell">
          <div className="flex flex-wrap gap-1">
            {stock.catalysts.slice(0, 3).map((c, i) => (
              <CatalystBadge key={i} catalyst={c} />
            ))}
          </div>
        </td>

        {/* Market Cap */}
        <td className="px-3 py-2.5 text-right hidden lg:table-cell text-gray-500 text-xs">
          {fmtMCap(stock.marketCap)}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-gray-900/80 border-b border-gray-700/50">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">

              {/* Score breakdown */}
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Score</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Price Change', val: stock.score.priceChange, max: 35, color: 'text-orange-400' },
                    { label: 'Volume', val: stock.score.volume, max: 25, color: 'text-blue-400' },
                    { label: 'Volatility (HV)', val: stock.score.volatility, max: 20, color: 'text-purple-400' },
                    { label: 'Catalyst', val: stock.score.catalyst, max: 20, color: 'text-yellow-400' },
                  ].map(({ label, val, max, color }) => (
                    <div key={label} className="flex justify-between items-center gap-3">
                      <span className={`${color} text-xs`}>{label}</span>
                      <span className="text-white text-xs tabular-nums">{val}/{max}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-700 pt-1.5">
                    <span className="text-white text-xs font-bold">Total</span>
                    <span className="text-white text-xs font-bold">{stock.score.total}/100</span>
                  </div>
                </div>
              </div>

              {/* Market data */}
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Market Data</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Mkt Cap', val: fmtMCap(stock.marketCap) },
                    { label: 'Avg Volume', val: fmtVol(stock.avgVolume) },
                    { label: 'Rel Volume', val: `${stock.relativeVolume}x` },
                    { label: 'HV (52W range)', val: `${stock.historicalVol}%` },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span className="text-gray-400 text-xs">{label}</span>
                      <span className="text-white text-xs tabular-nums">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings */}
              {stock.upcomingEarnings && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Earnings Alert</div>
                  <div className="bg-yellow-950/60 border border-yellow-700/40 rounded-md p-3">
                    <div className="text-yellow-300 font-bold text-sm">
                      {stock.upcomingEarnings.daysAway === 0
                        ? 'TODAY'
                        : `In ${stock.upcomingEarnings.daysAway} day${stock.upcomingEarnings.daysAway !== 1 ? 's' : ''}`}
                    </div>
                    <div className="text-yellow-600 text-xs mt-0.5">{stock.upcomingEarnings.date}</div>
                  </div>
                </div>
              )}

              {/* All catalysts + news detail */}
              {stock.catalysts.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Catalysts</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {stock.catalysts.map((c, i) => (
                      <CatalystBadge key={i} catalyst={c} />
                    ))}
                  </div>
                  {stock.catalysts[0].detail && (
                    <div className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                      {stock.catalysts[0].detail}
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
