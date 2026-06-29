# Refa App - Gestión de Rifas

Aplicación web para gestionar rifas con numeración del 1 al 100. Construida con Next.js 14, Supabase y Tailwind CSS.

## Funcionalidades

- **Interfaz Pública**: Vista de números asignados, cuenta regresiva al sorteo, resultado del ganador en tiempo real.
- **Panel Admin** (`/admin`): Crear rifas, asignar números a participantes, realizar sorteo aleatorio, historial de sorteos.
- **Tiempo Real**: Sincronización instantánea via Supabase Realtime.
- **Replicable**: Crear múltiples rifas independientes (una a la vez).

## Stack Técnico

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Realtime)

## Instalación

```bash
git clone https://github.com/jochanto/rifas.git
cd rifas
npm install
```

## Configuración

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta el SQL de migración para crear las tablas (rifas, participantes, ganadores).
3. Copia `.env.example` a `.env.local` y completa las variables:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

4. Crea un usuario admin en Supabase Auth (Dashboard > Authentication > Users).

## Desarrollo

```bash
npm run dev
```

- Vista pública: [http://localhost:3000](http://localhost:3000)
- Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Base de Datos

### Tablas

- **rifas**: id, nombre, descripcion, fecha_sorteo, estado (activo/completado), fecha_creacion
- **participantes**: id, rifa_id, nombre_participante, numero (1-100), fecha_creacion
- **ganadores**: id, rifa_id, numero_ganador, nombre_ganador, fecha_sorteo_realizado

## Deploy en Vercel

1. Conecta el repositorio en [Vercel](https://vercel.com).
2. Agrega las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy automático con cada push.
