interface ProgressBarProps {
  value: number
  max: number
  color: 'amber' | 'blue' | 'green'
}

export function ProgressBar({ value, max, color }: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  const colorClasses = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  }

  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className={`${colorClasses[color]} h-2 rounded-full transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
