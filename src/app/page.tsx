'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Rifa, Participante, Ganador } from '@/types/database'
import Countdown from '@/components/Countdown'
import NumberGrid from '@/components/NumberGrid'
import WinnerDisplay from '@/components/WinnerDisplay'
import Link from 'next/link'

export default function Home() {
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const rifaSub = supabase
      .channel('public-rifas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rifas' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ganadores' }, () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(rifaSub) }
  }, [])

  async function loadData() {
    const { data: rifas } = await supabase
      .from('rifas')
      .select('*')
      .order('fecha_creacion', { ascending: false })
      .limit(1)

    const activeRifa = rifas?.[0] ?? null
    setRifa(activeRifa)

    if (activeRifa) {
      const { data: parts } = await supabase
        .from('participantes')
        .select('*')
        .eq('rifa_id', activeRifa.id)
        .order('numero')
      setParticipantes(parts ?? [])

      if (activeRifa.estado === 'completado') {
        const { data: winners } = await supabase
          .from('ganadores')
          .select('*')
          .eq('rifa_id', activeRifa.id)
          .limit(1)
        setGanador(winners?.[0] ?? null)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Refa App</h1>
            <p className="text-indigo-200 text-sm">Gestión de Rifas</p>
          </div>
          <Link
            href="/admin"
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!rifa ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-600">No hay rifas activas</h2>
            <p className="text-gray-400 mt-2">Espera a que el administrador cree una nueva rifa.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{rifa.nombre}</h2>
              {rifa.descripcion && <p className="text-gray-500 mt-2">{rifa.descripcion}</p>}
            </div>

            {rifa.estado === 'completado' && ganador ? (
              <WinnerDisplay ganador={ganador} />
            ) : (
              <Countdown fechaSorteo={rifa.fecha_sorteo} />
            )}

            <NumberGrid participantes={participantes} ganador={ganador} />
          </>
        )}
      </main>
    </div>
  )
}
