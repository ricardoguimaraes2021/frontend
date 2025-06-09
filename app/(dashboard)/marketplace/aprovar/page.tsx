"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnunciosDataTable } from "./data-table"
import { columns } from "./columns"

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export default function AprovarAnunciosPage() {
  const router = useRouter()
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnunciosPendentes = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError("Sessão expirada. Faça login novamente.")
        toast.error("Sessão expirada", {
          description: "Faça login novamente para continuar.",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/anuncios-pendentes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar anúncios pendentes.")
      }

      const data = await response.json()

      if (data.user.role == 3 || data.user.role == 4){
        router.push("/marketplace")
      }
      else{
        const formattedData = data.ads.map((item: any) => {
          const ad = item.ad
          return {
            id: ad.id,
            titulo: ad.title,
            status: "Pendente",
            vendedor: ad.created_by_name || "Desconhecido",
            dataCriacao: new Date(ad.created_at).toLocaleDateString(),
            preco: `${ad.price}€`,
            categoria: ad.category_name,
            estado: ad.state_product_name,
            descricao: ad.description,
            imagens: item.images || [],
          }
        })
  
        setAnuncios(formattedData)
      }

    } catch (err: any) {
      setError(err.message)
      toast.error("Erro ao carregar anúncios", {
        description: err.message || "Não foi possível carregar os anúncios pendentes.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnunciosPendentes()
  }, [])

  const handleAprovarAnuncio = async (id: number) => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("Sessão expirada", {
          description: "Faça login novamente para continuar.",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/aprovar-anuncio/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status_id: 2 }), 
      })

      if (!response.ok) {
        throw new Error("Erro ao aprovar anúncio.")
      }

      toast.success("Anúncio aprovado", {
        description: "O anúncio foi aprovado com sucesso e já está disponível no marketplace.",
      })

      fetchAnunciosPendentes()
    } catch (err: any) {
      toast.error("Erro ao aprovar anúncio", {
        description: err.message || "Não foi possível aprovar o anúncio.",
      })
    }
  }

  const handleRejeitarAnuncio = async (id: number) => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("Sessão expirada", {
          description: "Faça login novamente para continuar.",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/rejeitar-anuncio/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status_id: 4 }),
      })

      if (!response.ok) {
        throw new Error("Erro ao rejeitar anúncio.")
      }

      toast.success("Anúncio rejeitado", {
        description: "O anúncio foi rejeitado com sucesso.",
      })

      fetchAnunciosPendentes()
    } catch (err: any) {
      toast.error("Erro ao rejeitar anúncio", {
        description: err.message || "Não foi possível rejeitar o anúncio.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Aprovar Anúncios</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anúncios Pendentes de Aprovação</CardTitle>
          <CardDescription>Aprove os anúncios submetidos pelos utilizadores.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4 max-w-md mx-auto border border-red-200 rounded-lg bg-red-50">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <Button onClick={() => fetchAnunciosPendentes()}>Tentar novamente</Button>
            </div>
          ) : anuncios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Não há anúncios pendentes de aprovação.</p>
            </div>
          ) : (
            <AnunciosDataTable
              columns={columns}
              data={anuncios}
              onAprovar={handleAprovarAnuncio}
              onRejeitar={handleRejeitarAnuncio}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

