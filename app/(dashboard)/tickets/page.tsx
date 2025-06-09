"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Search, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type TicketType = {
  id: number
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  creator_name: string
  solver_name: string | null
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showNewTicketDialog, setShowNewTicketDialog] = useState<boolean>(false)
  const [newTicketTitle, setNewTicketTitle] = useState<string>("")
  const [newTicketDescription, setNewTicketDescription] = useState<string>("")
  const [showFirstTicketDialog, setShowFirstTicketDialog] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState(false);


  const router = useRouter()

  // Função para obter o token de autenticação dos cookies
  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }

  // Função para buscar tickets
  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/getAllTickets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.message || "Erro ao buscar tickets.")
        } catch (jsonError) {
          throw new Error(errorText || "Erro ao buscar tickets.")
        }
      }

      const responseText = await response.text()
      if (!responseText || !responseText.trim()) {
        setTickets([])
        return
      }

      try {
        const data = JSON.parse(responseText)
        if (Array.isArray(data)) {
          setTickets(data)
        } else if (data && typeof data === "object") {
          const possibleArrays = Object.values(data).filter(Array.isArray)
          if (possibleArrays.length > 0) {
            setTickets(possibleArrays[0])
          } else {
            setTickets([])
          }
        } else {
          setTickets([])
        }
      } catch (parseError) {
        throw new Error("Erro ao processar a resposta da API.")
      }
    } catch (err) {
      console.error("Erro ao buscar tickets:", err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao buscar tickets.",
        variant: "destructive",
      })
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Função para criar um novo ticket
  const handleCreateTicket = async () => {
    setIsSubmitting(true);

    if (!newTicketTitle) {
      toast({
        title: "Erro",
        description: "O título do ticket é obrigatório.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/createTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTicketTitle,
          description: newTicketDescription,
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

      setNewTicketTitle("")
      setNewTicketDescription("")
      setShowNewTicketDialog(false)
      setShowFirstTicketDialog(false)

      fetchTickets()
    } catch (err: any) {
      console.error("Erro ao criar ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar ticket.",
        variant: "destructive",
      })
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.creator_name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Aberto":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Em andamento":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Fechado":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe os tickets de suporte.</p>
        </div>
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
              <DialogDescription>Preencha os detalhes para criar um novo ticket de suporte.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Título
                </Label>
                <Input
                  id="title"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} onClick={handleCreateTicket}>
                Criar Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Tickets Registados</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">Carregando...</div>
        ) : filteredTickets.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Título do Ticket</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Criado por</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Data do Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-900">{ticket.id}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{ticket.title}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={getStatusBadgeClass(ticket.latest_log?.state?.name || 'Pendente')}
                      >
                        {ticket.latest_log?.state?.name || 'Pendente'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-500">{ticket.creator.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Nenhum ticket encontrado com os filtros aplicados." : "Nenhum ticket disponível."}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <Dialog open={showFirstTicketDialog} onOpenChange={setShowFirstTicketDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar seu primeiro ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Ticket</DialogTitle>
                    <DialogDescription>Preencha os detalhes para criar um novo ticket de suporte.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title-new" className="text-right">
                        Título
                      </Label>
                      <Input
                        id="title-new"
                        value={newTicketTitle}
                        onChange={(e) => setNewTicketTitle(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description-new" className="text-right">
                        Descrição
                      </Label>
                      <Textarea
                        id="description-new"
                        value={newTicketDescription}
                        onChange={(e) => setNewTicketDescription(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreateTicket}>
                      Criar Ticket
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

