"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Search, XCircle, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }
  return null
}

const fetchPendingEventos = async () => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/eventosPending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar eventos pendentes")
  }

  return await response.json()
}

const fetchAllEventos = async () => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/eventosAll`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar todos os eventos")
  }

  return await response.json()
}

const approveEvento = async (id) => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/approve/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao aprovar evento")
  }

  return await response.json()
}

const rejectEvento = async (id) => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/reject/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao rejeitar evento")
  }

  return await response.json()
}

export default function AdminPage() {
  const [pendingEventos, setPendingEventos] = useState([])
  const [allEventos, setAllEventos] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedEventoId, setSelectedEventoId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadEventos = async () => {
      try {
        const pendingData = await fetchPendingEventos()
        const allData = await fetchAllEventos()
        setPendingEventos(pendingData)
        setAllEventos(allData)
      } catch (error) {
        console.error("Erro ao buscar eventos:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os eventos. Tente novamente mais tarde.",
        })
      }
    }

    loadEventos()
  }, [])

  const handleApprove = async () => {
    if (!selectedEventoId) return

    setIsLoading(true)
    try {
      await approveEvento(selectedEventoId)

      // Update the lists after approval
      setPendingEventos(pendingEventos.filter((evento) => evento.id !== selectedEventoId))

      // Refresh all eventos
      const updatedAllEventos = await fetchAllEventos()
      setAllEventos(updatedAllEventos)

      toast({
        title: "Evento aprovado",
        description: "O evento foi aprovado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao aprovar evento:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar o evento. Tente novamente mais tarde.",
      })
    } finally {
      setIsLoading(false)
      setIsApproveDialogOpen(false)
    }
  }

  const handleReject = async () => {
    if (!selectedEventoId) return

    setIsLoading(true)
    try {
      await rejectEvento(selectedEventoId)

      // Update the lists after rejection
      setPendingEventos(pendingEventos.filter((evento) => evento.id !== selectedEventoId))

      toast({
        title: "Evento rejeitado",
        description: "O evento foi rejeitado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao rejeitar evento:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar o evento. Tente novamente mais tarde.",
      })
    } finally {
      setIsLoading(false)
      setIsRejectDialogOpen(false)
    }
  }

  const getTipoBadgeClass = (tipo) => {
    switch (tipo) {
      case 1:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case 2:
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case 3:
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 3:
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>
    }
  }

  const filteredPendingEventos = pendingEventos.filter((evento) =>
    evento.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAllEventos = allEventos.filter((evento) =>
    evento.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/forum">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Gestão de Eventos</h1>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pendentes ({pendingEventos.length})</TabsTrigger>
          <TabsTrigger value="all">Todos os Eventos ({allEventos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-4 bg-secondary/50 px-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-medium">Eventos Pendentes</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar eventos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPendingEventos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[180px]">Data do Evento</TableHead>
                      <TableHead className="w-[180px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingEventos.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell className="font-medium">{evento.id}</TableCell>
                        <TableCell>
                          <Link href={`/forum/${evento.id}`} className="hover:underline">
                            {evento.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoBadgeClass(evento.event_type.id)} variant="outline">
                            {evento.event_type.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{evento.event_date}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => {
                                setSelectedEventoId(evento.id)
                                setIsApproveDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Aprovar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => {
                                setSelectedEventoId(evento.id)
                                setIsRejectDialogOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Rejeitar</span>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/forum/${evento.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Visualizar</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Não há eventos pendentes para aprovação.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-4 bg-secondary/50 px-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-medium">Todos os Eventos</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar eventos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredAllEventos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[180px]">Data do Evento</TableHead>
                      <TableHead className="w-[180px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllEventos.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell className="font-medium">{evento.id}</TableCell>
                        <TableCell>
                          <Link href={`/forum/${evento.id}`} className="hover:underline">
                            {evento.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoBadgeClass(evento.event_type.id)} variant="outline">
                            {evento.event_type.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{evento.event_date}</TableCell>
                        <TableCell>{getStatusBadge(evento.state)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Não há eventos disponíveis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Aprovação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza de que deseja aprovar este evento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsApproveDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isLoading}>
              {isLoading ? "Aprovando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Rejeição</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza de que deseja rejeitar este evento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRejectDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={isLoading}>
              {isLoading ? "Rejeitando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
