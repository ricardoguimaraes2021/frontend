"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const MapWithNoSSR = dynamic(() => import("./mapbox-component"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-md">
      <p className="text-muted-foreground">Carregando mapa...</p>
    </div>
  ),
})

const MapaClientWrapper = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const position = {
    long: -8.39475,
    lat: 41.53878,
  }

  if (!isMounted) return null

  return (
    <MapWithNoSSR
      initialPosition={position}
      initialZoom={18}
      bearing={60} 
    />
  )
}

export default MapaClientWrapper

