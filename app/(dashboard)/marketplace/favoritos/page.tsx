"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          setError("Sessão expirada. Faça login novamente.")
          setLoading(false)
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/getmyfavorites`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        /*if (!response.ok) {
          throw new Error("Erro ao carregar favoritos.")
        }*/

        const data = await response.json()

        if (data.favorites && Array.isArray(data.favorites)) {
          setFavorites(data.favorites)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const toggleFavorite = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()

    const token = getAuthToken()
    if (!token) {
      setError("Sessão expirada. Faça login novamente.")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/addfavorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: productId }),
      })

      if (!response.ok) {
        throw new Error("Erro ao remover dos favoritos.")
      }

      setFavorites(favorites.filter((fav) => fav.ad.id !== productId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meus Favoritos</h1>
      </div>

      {loading && <p className="text-center text-gray-500">Carregando favoritos...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {favorites.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 w-full">
            <p className="text-muted-foreground text-center">Você ainda não tem nenhum anúncio favoritado.</p>
            <Button asChild className="mt-4">
              <Link href="/marketplace">Explorar anúncios</Link>
            </Button>
          </div>
        )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorites) => (
          <Link
            key={favorites.ad.id}
            href={`/marketplace/${favorites.ad.id}`}
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <Card className="h-full overflow-hidden cursor-pointer relative">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src={favorites.images[0] || "/placeholder.svg"}
                  alt={favorites.ad.title}
                  width={300}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="line-clamp-1 font-medium mb-1">{favorites.ad.title}</h3>
                    <p className="font-bold text-primary">{favorites.ad.price}€</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-red-500 hover:text-red-600"
                    onClick={(e) => toggleFavorite(e, favorites.ad.id)}
                  >
                    <Heart className="h-7 w-7 fill-current" />
                    <span className="sr-only">Remover dos favoritos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
