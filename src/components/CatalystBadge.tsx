import type { Catalyst } from '@/lib/types'

const CATALYST_STYLES: Record<string, string> = {
  EARNINGS_TODAY: 'bg-yellow-400 text-black font-bold animate-pulse',
  EARNINGS_SOON: 'bg-yellow-800/80 text-yellow-200',
  FDA: 'bg-purple-700 text-white',
  MA: 'bg-blue-700 text-white',
  ANALYST_UPGRADE: 'bg-green-800 text-green-200',
  ANALYST_DOWNGRADE: 'bg-red-800 text-red-200',
  PARTNERSHIP: 'bg-cyan-800 text-cyan-200',
  PRODUCT_LAUNCH: 'bg-indigo-700 text-white',
}

export function CatalystBadge({ catalyst }: { catalyst: Catalyst }) {
  const cls = CATALYST_STYLES[catalyst.type] ?? 'bg-gray-700 text-gray-200'
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}
      title={catalyst.detail}
    >
      {catalyst.label}
    </span>
  )
}
