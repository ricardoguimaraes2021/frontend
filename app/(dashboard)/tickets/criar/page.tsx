"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

export default function CreateTicketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Função para obter o token de autenticação dos cookies
  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true); // Desativa o botão aqui

    e.preventDefault()

    try {
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive",
        })
        return
      }


      // Criar o ticket
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/createTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.message || "Erro ao criar ticket.")
        } catch (e) {
          throw new Error(errorText || "Erro ao criar ticket.")
        }
      }

      toast({
        title: "Sucesso!",
        description: "Ticket criado com sucesso.",
      })

      // Redirecionar para a lista de tickets
      router.push("/tickets")
    } catch (err: any) {
      console.error("Erro ao criar ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar ticket.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto mt-8">
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/tickets")} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Tickets
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Criar Novo Ticket</h1>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Título:
          </label>
          <Input
            type="text"
            id="title"
            name="title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Descrição:
          </label>
          <Textarea
            id="description"
            name="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <Button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "A criar..." : "Criar Ticket"}
          </Button>
        </div>
      </form>
    </div>
  )
}

