'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { isAdminPath } from '@/lib/admin-routes'

type Mote = { x: number; y: number; r: number; vy: number; vx: number; phase: number; speed: number }

/** Polvo dorado que flota despacio y titila detrás de toda la tienda. Se apaga solo si el visitante prefiere menos movimiento. */
export function GoldDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pathname = usePathname()
  const hidden = isAdminPath(pathname)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || hidden) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = canvas.getContext('2d')
    if (!context) return

    let width = 0
    let height = 0
    let motes: Mote[] = []
    let frame = 0
    let running = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const build = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = width < 700 ? 11 : 22
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 5 + Math.random() * 8,
        vy: -(0.05 + Math.random() * 0.15),
        vx: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.02,
      }))
    }

    const draw = () => {
      if (!running) return
      context.clearRect(0, 0, width, height)
      for (const mote of motes) {
        mote.x += mote.vx + Math.sin(mote.phase * 0.7) * 0.08
        mote.y += mote.vy
        mote.phase += mote.speed
        if (mote.y < -8) { mote.y = height + 8; mote.x = Math.random() * width }
        if (mote.x < -8) mote.x = width + 8
        if (mote.x > width + 8) mote.x = -8
        const twinkle = Math.pow(Math.abs(Math.sin(mote.phase)), 1.6)
        if (twinkle < 0.04) continue
        const size = mote.r * (0.55 + 0.45 * twinkle)
        const waist = size * 0.028
        // Estrella fina de cuatro puntas (una cruz delgada que se afila hacia los extremos)
        context.save()
        context.translate(mote.x, mote.y)
        context.globalAlpha = 0.9 * twinkle
        const halo = context.createRadialGradient(0, 0, 0, 0, 0, size * 0.42)
        halo.addColorStop(0, 'rgba(255,244,205,0.5)')
        halo.addColorStop(1, 'rgba(228,190,106,0)')
        context.fillStyle = halo
        context.beginPath()
        context.arc(0, 0, size * 0.42, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = 'rgba(255,244,214,1)'
        context.shadowColor = 'rgba(236,200,120,0.9)'
        context.shadowBlur = 10
        context.beginPath()
        context.moveTo(0, -size)
        context.quadraticCurveTo(waist, -waist, size, 0)
        context.quadraticCurveTo(waist, waist, 0, size)
        context.quadraticCurveTo(-waist, waist, -size, 0)
        context.quadraticCurveTo(-waist, -waist, 0, -size)
        context.closePath()
        context.fill()
        context.restore()
      }
      frame = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) frame = requestAnimationFrame(draw)
    }

    build()
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', build)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', build)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [hidden])

  if (hidden) return null
  return <canvas ref={canvasRef} className="gold-dust" aria-hidden="true" />
}
