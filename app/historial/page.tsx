'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'

type Cambio = { campo: string; antes: string; despues: string }
type Entry = {
  id: string
  fecha: string
  usuario: string
  nombre: string
  tipo: string
  accion: string
  resumen: string
  cambios?: Cambio[]
  detalle?: string[]
}
type PublicUser = { usuario: string; nombre: string }

const TIPOS: Record<string, string> = {
  producto: 'Productos',
  ajustes: 'Ventas',
  pedido: 'Pedidos',
  imagen: 'Imágenes',
  usuario: 'Usuarios',
  sesion: 'Accesos',
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

const when = (iso: string) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export default function HistorialPage() {
  const [usuario, setUsuario] = useState('')
  const [tipo, setTipo] = useState('')
  const [limit, setLimit] = useState(100)
  const query = new URLSearchParams({ limit: String(limit), ...(usuario ? { usuario } : {}), ...(tipo ? { tipo } : {}) }).toString()
  const { data: entries = [], error, isLoading } = useSWR<Entry[]>(`/api/historial?${query}`, fetcher, { revalidateOnFocus: true })
  const { data: users = [] } = useSWR<PublicUser[]>('/api/usuarios', fetcher)

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row">
          <div>
            <p className="admin-eyebrow">SOLO PARA EL DUEÑO</p>
            <h1>Historial de <em>cambios.</em></h1>
            <p className="admin-lede">Quién hizo qué y cuándo: productos agregados, editados o eliminados, cambios de configuración, pedidos y accesos al panel.</p>
          </div>
          <Link href="/admin" className="admin-back">Ir al panel →</Link>
        </div>

        <div className="history-filters">
          <label>Persona
            <select value={usuario} onChange={(event) => { setUsuario(event.target.value); setLimit(100) }}>
              <option value="">Todas</option>
              {users.map((user) => <option key={user.usuario} value={user.usuario}>{user.nombre} ({user.usuario})</option>)}
            </select>
          </label>
          <label>Tipo de movimiento
            <select value={tipo} onChange={(event) => { setTipo(event.target.value); setLimit(100) }}>
              <option value="">Todos</option>
              {Object.entries(TIPOS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        {error && <p className="admin-notice" role="status">No se pudo leer el historial. Abre el panel desde localhost e inicia sesión como dueño.</p>}
        {!error && !isLoading && entries.length === 0 && <p className="admin-empty">Todavía no hay movimientos con estos filtros.</p>}

        <ol className="history-list">
          {entries.map((entry) => (
            <li key={entry.id} className={`history-item history-${entry.tipo}`}>
              <div className="history-head">
                <span className="history-who">{entry.nombre || entry.usuario}</span>
                {entry.nombre && <span className="history-user">@{entry.usuario}</span>}
                <span className="history-type">{TIPOS[entry.tipo] ?? entry.tipo}</span>
                <time dateTime={entry.fecha}>{when(entry.fecha)}</time>
              </div>
              <p className="history-summary">{entry.resumen}</p>
              {entry.cambios && entry.cambios.length > 0 && (
                <ul className="history-changes">
                  {entry.cambios.map((cambio) => (
                    <li key={cambio.campo}><span>{cambio.campo}</span><del>{cambio.antes}</del><b aria-hidden="true">→</b><ins>{cambio.despues}</ins></li>
                  ))}
                </ul>
              )}
              {entry.detalle && entry.detalle.length > 0 && (
                <details className="history-details">
                  <summary>Ver detalle ({entry.detalle.length})</summary>
                  <ul>{entry.detalle.map((line, index) => <li key={index}>{line}</li>)}</ul>
                </details>
              )}
            </li>
          ))}
        </ol>

        {entries.length >= limit && (
          <div className="settings-actions history-more"><button type="button" className="admin-secondary" onClick={() => setLimit((value) => value + 100)}>Ver movimientos anteriores</button></div>
        )}
      </section>
    </main>
  )
}
