export interface Database {
  public: {
    Tables: {
      rifas: {
        Row: Rifa
        Insert: Omit<Rifa, 'id' | 'fecha_creacion'>
        Update: Partial<Omit<Rifa, 'id'>>
      }
      participantes: {
        Row: Participante
        Insert: Omit<Participante, 'id' | 'fecha_creacion'>
        Update: Partial<Omit<Participante, 'id'>>
      }
      ganadores: {
        Row: Ganador
        Insert: Omit<Ganador, 'id' | 'fecha_sorteo_realizado'>
        Update: Partial<Omit<Ganador, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Rifa {
  id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  precio_numero: number | null
  fecha_sorteo: string
  estado: 'activo' | 'completado'
  fecha_creacion: string
}

export interface Participante {
  id: string
  rifa_id: string
  nombre_participante: string
  numero: number
  telefono: string | null
  fecha_creacion: string
}

export interface Ganador {
  id: string
  rifa_id: string
  numero_ganador: number
  nombre_ganador: string
  fecha_sorteo_realizado: string
}
