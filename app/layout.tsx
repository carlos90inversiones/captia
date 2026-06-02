import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Captia — Clientes automáticos para tu negocio',
  description: 'La IA que encuentra y contacta clientes potenciales por ti. Sin esfuerzo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  )
}
