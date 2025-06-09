"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { pt, ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import MapaClientWrapper from "@/components/mapa-condominio/mapa-client-wrapper"

type Ticket = {
  id: number
  title: string
  status: string
  created_at: string
}

type Evento = {
  id: number
  title: string
  date: string
}


export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketsError, setTicketsError] = useState<string | null>(null)

  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoadingEventos, setIsLoadingEventos] = useState(true)
  const [eventosError, setEventosError] = useState<string | null>(null)

  const router = useRouter()

  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }

  useEffect(() => {
    const fetchPendingTickets = async () => {
      setIsLoadingTickets(true)
      setTicketsError(null)

      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.")
          router.push("/login"); 
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/getMyTicketsOpen`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log(response);
        if (response.status === 500) {
          router.push("/login"); 
          return;
        }

        if (!response.ok) {
          throw new Error("Erro ao buscar tickets pendentes.")
        }

        const data = await response.json()

        const pendingTickets = data

        setTickets(pendingTickets)
      } catch (error) {
        console.error("Erro ao buscar tickets:", error)
        setTicketsError(error instanceof Error ? error.message : "Erro ao carregar tickets.")
      } finally {
        setIsLoadingTickets(false)
      }
    }

    fetchPendingTickets()
  }, [])

  useEffect(() => {
    const fetchFutureEvents = async () => {
      setIsLoadingEventos(true)
      setEventosError(null)

      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.")
          router.push("/login"); 
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/eventosActive`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
                },
        })

        if (!response.ok) {
          throw new Error("Erro ao buscar eventos futuros.")
        }

        const data = await response.json()


        setEventos(data)
      } catch (error) {
        console.error("Erro ao buscar eventos:", error)
        setEventosError(error instanceof Error ? error.message : "Erro ao carregar eventos.")
      } finally {
        setIsLoadingEventos(false)
      }
    }

    fetchFutureEvents()

  }, [])



  const handleTicketClick = (ticketId: number) => {
    router.push(`/tickets/${ticketId}`)
  }

  const handleEventoClick = (eventoId: number) => {
    router.push(`/forum/${eventoId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aberto":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Aberto</Badge>
      case "Em andamento":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Em andamento</Badge>
      case "Fechado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Fechado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderEventosContent = () => {
    if (isLoadingEventos) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span>Carregando eventos...</span>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (eventosError) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center text-red-500">
            Erro ao carregar eventos: {eventosError}
          </TableCell>
        </TableRow>
      )
    }

    if (eventos.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
            Não há eventos futuros.
          </TableCell>
        </TableRow>
      )
    }

    return eventos.slice(0, 5).map((evento) => (
      <TableRow
        key={evento.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => handleEventoClick(evento.id)}
      >
        <TableCell>{evento.id}</TableCell>
        <TableCell>{evento.title}</TableCell>
        <TableCell>{evento.location}</TableCell>
        <TableCell>{format(new Date(evento.event_date), "dd/MM/yyyy", { locale: pt })}</TableCell>
      </TableRow>
    ))
  }

  const renderTicketsContent = () => {
    if (isLoadingTickets) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span>Carregando tickets...</span>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (ticketsError) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-red-500">
            Erro ao carregar tickets: {ticketsError}
          </TableCell>
        </TableRow>
      )
    }

    if (tickets.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
            Não há tickets pendentes.
          </TableCell>
        </TableRow>
      )
    }

    return tickets.slice(0, 5).map((ticket) => (
      <TableRow
        key={ticket.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => handleTicketClick(ticket.id)}
      >
        <TableCell>{ticket.id}</TableCell>
        <TableCell>{ticket.title}</TableCell>
        <TableCell>{getStatusBadge(ticket.latest_log.state.name)}</TableCell>
        <TableCell>{format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu painel de controle.</p>
      </div>

      <Separator />

      {/* Mapa do Condomínio */}
      <Card className="overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-secondary/50 px-6">
          <CardTitle className="text-lg font-medium">Mapa do Condomínio</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <MapaClientWrapper />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-secondary/50 px-6">
            <CardTitle className="text-lg font-medium">Eventos Ativos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Id</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-[150px]">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderEventosContent()}</TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="bg-secondary/50 px-6">
            <CardTitle className="text-lg font-medium">Meus Tickets Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Id</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead className="w-[150px]">Data de abertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTicketsContent()}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

