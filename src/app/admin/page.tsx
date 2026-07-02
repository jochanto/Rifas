'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signIn, signOut } from '@/lib/auth'
import { Rifa, Participante, Ganador } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import type { Session } from '@supabase/supabase-js'

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Error de autenticación')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Admin - Refa App</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard onSignOut={() => signOut()} />
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [historial, setHistorial] = useState<(Ganador & { rifa_nombre?: string })[]>([])
  const [nombre, setNombre] = useState('')
  const [numero, setNumero] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rifaNombre, setRifaNombre] = useState('')
  const [rifaDescripcion, setRifaDescripcion] = useState('')
  const [fechaSorteo, setFechaSorteo] = useState('')
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [sorteoLoading, setSorteoLoading] = useState(false)
  const [tab, setTab] = useState<'rifa' | 'historial'>('rifa')

  useEffect(() => {
    loadAll()
    const sub = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rifas' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ganadores' }, () => loadAll())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  async function loadAll() {
    const { data: rifas } = await supabase
      .from('rifas')
      .select('*')
      .eq('estado', 'activo')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
    const activeRifa = rifas?.[0] ?? null
    setRifa(activeRifa)

    if (activeRifa) {
      const { data } = await supabase
        .from('participantes')
        .select('*')
        .eq('rifa_id', activeRifa.id)
        .order('numero')
      setParticipantes(data ?? [])
    } else {
      setParticipantes([])
    }

    const { data: winners } = await supabase
      .from('ganadores')
      .select('*, rifas(nombre)')
      .order('fecha_sorteo_realizado', { ascending: false })
    setHistorial(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (winners ?? []).map((w: any) => ({
        id: w.id,
        rifa_id: w.rifa_id,
        numero_ganador: w.numero_ganador,
        nombre_ganador: w.nombre_ganador,
        fecha_sorteo_realizado: w.fecha_sorteo_realizado,
        rifa_nombre: w.rifas?.nombre,
      }))
    )
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImagenFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setImagenPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagenPreview(null)
    }
  }

  async function crearRifa(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUploading(true)

    let imagen_url: string | null = null
    if (imagenFile) {
      const ext = imagenFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('rifas-imagenes')
        .upload(path, imagenFile)
      if (uploadErr) { setError(uploadErr.message); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('rifas-imagenes').getPublicUrl(path)
      imagen_url = urlData.publicUrl
    }

    const { error: err } = await supabase.from('rifas').insert({
      nombre: rifaNombre,
      descripcion: rifaDescripcion || null,
      imagen_url,
      fecha_sorteo: new Date(fechaSorteo).toISOString(),
      estado: 'activo',
    })
    if (err) { setError(err.message); setUploading(false); return }
    setRifaNombre('')
    setRifaDescripcion('')
    setFechaSorteo('')
    setImagenFile(null)
    setImagenPreview(null)
    setUploading(false)
    loadAll()
  }

  async function agregarParticipante(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!rifa) return
    const num = parseInt(numero)
    if (num < 1 || num > 100) { setError('El número debe estar entre 1 y 100'); return }
    if (participantes.some((p) => p.numero === num)) { setError(`El número ${num} ya está asignado`); return }

    const { error: err } = await supabase.from('participantes').insert({
      rifa_id: rifa.id,
      nombre_participante: nombre,
      numero: num,
      telefono: telefono || null,
    })
    if (err) { setError(err.message); return }
    setNombre('')
    setNumero('')
    setTelefono('')
    loadAll()
  }

  async function eliminarParticipante(id: string) {
    await supabase.from('participantes').delete().eq('id', id)
    loadAll()
  }

  async function realizarSorteo() {
    if (!rifa || participantes.length === 0) return
    setSorteoLoading(true)
    const randomIdx = Math.floor(Math.random() * participantes.length)
    const winner = participantes[randomIdx]

    await supabase.from('ganadores').insert({
      rifa_id: rifa.id,
      numero_ganador: winner.numero,
      nombre_ganador: winner.nombre_participante,
    })
    await supabase.from('rifas').update({ estado: 'completado' }).eq('id', rifa.id)
    setSorteoLoading(false)
    loadAll()
  }

  async function nuevaRifa() {
    setRifa(null)
    setParticipantes([])
  }

  async function eliminarRifa() {
    if (!rifa) return
    if (!confirm('¿Estás seguro de eliminar esta rifa? Se borrarán todos los participantes.')) return
    await supabase.from('rifas').delete().eq('id', rifa.id)
    setRifa(null)
    setParticipantes([])
    loadAll()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-indigo-200 hover:text-white transition text-sm">&larr; Ver público</Link>
            <h1 className="text-xl font-bold">Panel de Administración</h1>
          </div>
          <button onClick={onSignOut} className="text-indigo-200 hover:text-white transition text-sm">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('rifa')}
            className={`px-4 py-2 rounded-lg font-medium transition ${tab === 'rifa' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Rifa Actual
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`px-4 py-2 rounded-lg font-medium transition ${tab === 'historial' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Historial
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
          </div>
        )}

        {tab === 'rifa' && (
          <>
            {!rifa ? (
              <div className="bg-white rounded-xl shadow p-6 max-w-lg">
                <h2 className="text-xl font-bold mb-4">Crear Nueva Rifa</h2>
                <form onSubmit={crearRifa} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Rifa</label>
                    <input
                      value={rifaNombre}
                      onChange={(e) => setRifaNombre(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                      placeholder="Ej: Rifa Navideña 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                    <input
                      value={rifaDescripcion}
                      onChange={(e) => setRifaDescripcion(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ej: Premio: TV 55 pulgadas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Premio (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-medium file:cursor-pointer"
                    />
                    {imagenPreview && (
                      <img src={imagenPreview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora del Sorteo</label>
                    <input
                      type="datetime-local"
                      value={fechaSorteo}
                      onChange={(e) => setFechaSorteo(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button type="submit" disabled={uploading} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                    {uploading ? 'Subiendo imagen...' : 'Crear Rifa'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow p-6">
                  {rifa.imagen_url && (
                    <div className="relative w-full h-48 mb-4">
                      <Image src={rifa.imagen_url} alt={rifa.nombre} fill className="object-cover rounded-lg" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{rifa.nombre}</h2>
                      <p className="text-gray-500 text-sm">
                        Sorteo: {new Date(rifa.fecha_sorteo).toLocaleString('es-CR')} &bull; {participantes.length}/100 números asignados
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={realizarSorteo}
                        disabled={sorteoLoading || participantes.length === 0}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sorteoLoading ? 'Sorteando...' : '🎲 Realizar Sorteo'}
                      </button>
                      <button
                        onClick={nuevaRifa}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                      >
                        Nueva Rifa
                      </button>
                      <button
                        onClick={eliminarRifa}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                      >
                        Eliminar Rifa
                      </button>
                    </div>
                  </div>

                  <form onSubmit={agregarParticipante} className="flex flex-wrap gap-3 items-end border-t pt-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                        placeholder="Nombre del participante"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Ej: 8888-8888"
                      />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                      Agregar
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombre</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Teléfono</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {participantes.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay participantes aún</td></tr>
                      ) : (
                        participantes.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-indigo-600">{p.numero}</td>
                            <td className="px-4 py-3">{p.nombre_participante}</td>
                            <td className="px-4 py-3 text-gray-500">{p.telefono ?? '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => eliminarParticipante(p.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'historial' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rifa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600"># Ganador</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ganador</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historial.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay sorteos realizados</td></tr>
                ) : (
                  historial.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{h.rifa_nombre ?? '—'}</td>
                      <td className="px-4 py-3 font-bold text-indigo-600">{h.numero_ganador}</td>
                      <td className="px-4 py-3">{h.nombre_ganador}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(h.fecha_sorteo_realizado).toLocaleString('es-CR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
