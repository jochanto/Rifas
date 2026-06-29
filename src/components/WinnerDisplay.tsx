'use client'

import { Ganador } from '@/types/database'

interface Props {
  ganador: Ganador
}

export default function WinnerDisplay({ ganador }: Props) {
  return (
    <div className="text-center py-8">
      <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-2xl p-8 text-white">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">¡Tenemos Ganador!</h2>
        <div className="text-5xl font-black my-4">#{ganador.numero_ganador}</div>
        <div className="text-xl font-semibold">{ganador.nombre_ganador}</div>
        <div className="text-yellow-100 text-sm mt-2">
          {new Date(ganador.fecha_sorteo_realizado).toLocaleString('es-CR')}
        </div>
      </div>
    </div>
  )
}
