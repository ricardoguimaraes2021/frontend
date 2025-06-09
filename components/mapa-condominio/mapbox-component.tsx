"use client"

import { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MapboxToken

type MapboxComponentProps = {
  initialPosition: {
    long: number
    lat: number
  }
  initialZoom?: number
  bearing?: number
}

type Marker = {
  id: number
  position: {
    id: number
    long: number
    lat: number
  }
  labels: string[]
}

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

const MapboxComponent = ({ initialPosition, initialZoom = 16, bearing = 0 }: MapboxComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const mapboxMarkers = useRef<{ [key: number]: mapboxgl.Marker }>({})

  const fetchUsersHouses = async () => {
    const token = getAuthToken()

    if (token) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usersHouse`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        const houseMap = new Map<number, Marker>()

        data.forEach((user: any) => {
          const houseId = user.house.id
          const housePosition = { id: houseId, long: user.house.long, lat: user.house.lat }

          if (houseMap.has(houseId)) {
            houseMap.get(houseId)!.labels.push(`Morador: ${user.name}`)
          } else {
            houseMap.set(houseId, { id: houseId, position: housePosition, labels: [`Morador: ${user.name}`] })
          }
        })

        setMarkers(Array.from(houseMap.values()))
      } else {
        console.error("Erro ao buscar dados: ", response.statusText)
      }
    }
  }

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialPosition.long, initialPosition.lat],
      zoom: initialZoom,
      bearing: bearing,
      attributionControl: false,
      pitch: 0,

      dragPan: false,
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
    })

    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
      }),
      "bottom-right",
    )

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    Object.keys(mapboxMarkers.current).forEach((idStr) => {
      const id = Number.parseInt(idStr)
      if (!markers.some((m) => m.id === id)) {
        mapboxMarkers.current[id].remove()
        delete mapboxMarkers.current[id]
      }
    })

    markers.forEach((marker) => {
      if (!mapboxMarkers.current[marker.id]) {
        const popupContent = document.createElement("div")
        popupContent.innerHTML = `
          <strong>Casa Nº ${marker.position.id}</strong><br>
          ${marker.labels.join("<br>")}
        `

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent)

        const mapboxMarker = new mapboxgl.Marker()
          .setLngLat([marker.position.long, marker.position.lat])
          .setPopup(popup)
          .addTo(map.current!)

        mapboxMarkers.current[marker.id] = mapboxMarker
      }
    })
  }, [markers])

  useEffect(() => {
    fetchUsersHouses()
  }, [])

  return (
    <div className="relative rounded-md overflow-hidden">
      <div ref={mapContainer} className="h-[500px] w-full" />
    </div>
  )
}

export default MapboxComponent
