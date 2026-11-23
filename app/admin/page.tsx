import type { Metadata } from 'next'
import { AdminCatalog } from '@/components/admin-catalog'

export const metadata: Metadata = {
  title: 'Gestión local · ZENIT Joyería',
  description: 'Administra el catálogo local de ZENIT Joyería desde tu equipo.',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminCatalog />
}
