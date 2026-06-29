'use client'

import { Participante, Ganador } from '@/types/database'

interface Props {
  participantes: Participante[]
  ganador: Ganador | null
}

export default function NumberGrid({ participantes, ganador }: Props) {
  const map = new Map(participantes.map((p) => [p.numero, p.nombre_participante]))

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Números del 1 al 100</h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
          const nombre = map.get(num)
          const isWinner = ganador?.numero_ganador === num
          return (
            <div
              key={num}
              className={`relative rounded-lg p-2 text-center transition-all ${
                isWinner
                  ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500 shadow-lg scale-105'
                  : nombre
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-400'
              }`}
              title={nombre ?? 'Disponible'}
            >
              <div className="text-lg font-bold">{num}</div>
              <div className="text-[10px] truncate leading-tight min-h-[14px]">
                {nombre ?? '—'}
              </div>
              {isWinner && <span className="absolute -top-1 -right-1 text-sm">🏆</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
