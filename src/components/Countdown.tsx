'use client'

import { useEffect, useState } from 'react'

interface Props {
  fechaSorteo: string
}

export default function Countdown({ fechaSorteo }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(fechaSorteo).getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [fechaSorteo])

  if (expired) {
    return (
      <div className="text-center py-8">
        <div className="inline-block bg-yellow-100 text-yellow-800 px-6 py-3 rounded-xl text-lg font-semibold animate-pulse">
          El sorteo puede realizarse en cualquier momento
        </div>
      </div>
    )
  }

  const blocks = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Minutos', value: timeLeft.minutes },
    { label: 'Segundos', value: timeLeft.seconds },
  ]

  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4 text-sm uppercase tracking-wide">Sorteo en</p>
      <div className="flex justify-center gap-4">
        {blocks.map((b) => (
          <div key={b.label} className="bg-white rounded-xl shadow-md p-4 min-w-[80px]">
            <div className="text-3xl font-bold text-indigo-600">{String(b.value).padStart(2, '0')}</div>
            <div className="text-xs text-gray-400 mt-1">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
