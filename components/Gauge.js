import { useMemo } from 'react'

export default function Gauge({ value = 50, size = 220 }) {
  const v = Math.max(0, Math.min(100, value))
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const startAngle = -90
  const endAngle = 90

  const angle = startAngle + (v / 100) * (endAngle - startAngle)

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(cx, cy, r, start, end) {
    const startPt = polarToCartesian(cx, cy, r, end)
    const endPt = polarToCartesian(cx, cy, r, start)
    const largeArcFlag = end - start <= 180 ? 0 : 1
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${endPt.x} ${endPt.y}`
  }

  const bgArc = useMemo(() => describeArc(cx, cy, r, startAngle, endAngle), [cx, cy, r])
  const progressArc = useMemo(() => describeArc(cx, cy, r, startAngle, angle), [cx, cy, r, angle])

  const needle = useMemo(() => {
    const inner = polarToCartesian(cx, cy, 8, angle)
    const tip = polarToCartesian(cx, cy, r - 4, angle)
    return { x1: inner.x, y1: inner.y, x2: tip.x, y2: tip.y }
  }, [cx, cy, r, angle])

  const color = v >= 75 ? '#2e7d32' : v >= 50 ? '#f59e0b' : '#ef4444'

  const ticks = useMemo(() => {
    const arr = []
    for (let t = 0; t <= 100; t += 10) {
      const a = startAngle + (t / 100) * (endAngle - startAngle)
      const p1 = polarToCartesian(cx, cy, r + 2, a)
      const p2 = polarToCartesian(cx, cy, r - 10, a)
      arr.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
    }
    return arr
  }, [cx, cy, r])

  const grad = useMemo(() => {
    const s = polarToCartesian(cx, cy, r, startAngle)
    const e = polarToCartesian(cx, cy, r, endAngle)
    return { x1: s.x, y1: s.y, x2: e.x, y2: e.y }
  }, [cx, cy, r])

  return (
    <div className="w-full flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <defs>
          <linearGradient id="gaugeGradient" gradientUnits="userSpaceOnUse" x1={grad.x1} y1={grad.y1} x2={grad.x2} y2={grad.y2}>
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d={bgArc} stroke="#e5e7eb" strokeWidth="16" fill="none" />
        <path d={progressArc} stroke="url(#gaugeGradient)" strokeWidth="16" strokeLinecap="round" fill="none" />

        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#9ca3af" strokeWidth={i % 5 === 0 ? 2 : 1} />
        ))}

        <circle cx={cx} cy={cy} r="6" fill="#374151" />
        <line x1={needle.x1} y1={needle.y1} x2={needle.x2} y2={needle.y2} stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="mt-2 text-center">
        <span className="text-2xl font-bold" style={{ color }}>{v.toFixed(2)}%</span>
      </div>
    </div>
  )
}
