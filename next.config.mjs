/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Solo en desarrollo: permite abrir el sitio desde el celular u otro equipo
  // de la misma red Wi-Fi (por ejemplo http://192.168.1.20:3000).
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
}

export default nextConfig
