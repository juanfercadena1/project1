import type { ScoreBreakdown } from '@/lib/types'

type ScoreKey = 'priceChange' | 'volume' | 'volatility' | 'catalyst'

const BARS: { key: ScoreKey; label: string; max: number; color: string }[] = [
  { key: 'priceChange', label: 'Price', max: 35, color: '#f97316' },
  { key: 'volume', label: 'Vol', max: 25, color: '#3b82f6' },
  { key: 'volatility', label: 'HV', max: 20, color: '#a855f7' },
  { key: 'catalyst', label: 'Cat', max: 20, color: '#eab308' },
]

export function ScoreMeter({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white font-bold text-sm tabular-nums w-7">{score.total}</span>
      <div className="flex gap-0.5">
        {BARS.map(({ key, max, color, label }) => {
          const pct = Math.min((score[key] / max) * 100, 100)
          return (
            <div
              key={key}
              className="w-8 h-3 bg-gray-800 rounded-sm overflow-hidden"
              title={`${label}: ${score[key]}/${max}`}
            >
              <div
                className="h-full rounded-sm"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
