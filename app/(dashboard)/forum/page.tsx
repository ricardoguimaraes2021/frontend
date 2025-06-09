"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Settings, Calendar, User, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }
  return null
}

const fetchEventosAtivos = async () => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/eventosActive`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar eventos ativos")
  }

  return await response.json()
}

const fetchMeusEventos = async () => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/myEventos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar meus eventos")
  }

  return await response.json()
}

const fetchMinhasRespostas = async () => {
  const token = getAuthToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/myAswers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar minhas respostas")
  }

  return await response.json()
}

const checkIsAdmin = async () => {
  const token = getAuthToken()
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return false
    }

    const userData = await response.json()

    if (userData.role == 1 || userData.role == 2) {
      return true
    }
  } catch (error) {
    console.error("Erro ao verificar permissões de admin:", error)
    return false
  }
}

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState("eventos-ativos")
  const [eventosAtivos, setEventosAtivos] = useState([])
  const [meusEventos, setMeusEventos] = useState([])
  const [minhasRespostas, setMinhasRespostas] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState({
    ativos: true,
    meus: true,
    respostas: true,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar eventos ativos
        setIsLoading((prev) => ({ ...prev, ativos: true }))
        const eventosAtivosData = await fetchEventosAtivos()
        setEventosAtivos(eventosAtivosData)
        setIsLoading((prev) => ({ ...prev, ativos: false }))

        // Verificar status de admin
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
        setIsLoading((prev) => ({ ...prev, ativos: false }))
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadMeusEventos = async () => {
      if (activeTab === "meus-eventos" && meusEventos.length === 0) {
        try {
          setIsLoading((prev) => ({ ...prev, meus: true }))
          const data = await fetchMeusEventos()
          setMeusEventos(data)
        } catch (error) {
          console.error("Erro ao carregar meus eventos:", error)
        } finally {
          setIsLoading((prev) => ({ ...prev, meus: false }))
        }
      }
    }

    loadMeusEventos()
  }, [activeTab, meusEventos.length])

  useEffect(() => {
    const loadMinhasRespostas = async () => {
      if (activeTab === "minhas-respostas" && minhasRespostas.length === 0) {
        try {
          setIsLoading((prev) => ({ ...prev, respostas: true }))
          const data = await fetchMinhasRespostas()
          setMinhasRespostas(data)
        } catch (error) {
          console.error("Erro ao carregar minhas respostas:", error)
        } finally {
          setIsLoading((prev) => ({ ...prev, respostas: false }))
        }
      }
    }

    loadMinhasRespostas()
  }, [activeTab, minhasRespostas.length])

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

  const getRespostaBadge = (resposta) => {
    switch (resposta) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Sem resposta</Badge>
    }
  }

  const filteredEventosAtivos = eventosAtivos.filter((evento) =>
    evento.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMeusEventos = meusEventos.filter((evento) =>
    evento.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMinhasRespostas = minhasRespostas.filter((evento) =>
    evento.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fórum</h1>
          <p className="text-muted-foreground">Gerencie e participe nos eventos do condomínio.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/forum/criar-evento">
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Evento
            </Link>
          </Button>

          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/forum/aprovar">
                <Settings className="mr-2 h-4 w-4" />
                Gestão de Eventos
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="eventos-ativos" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="eventos-ativos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos Ativos</span>
            <span className="sm:hidden">Ativos</span>
          </TabsTrigger>
          <TabsTrigger value="meus-eventos" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Meus Eventos</span>
            <span className="sm:hidden">Meus</span>
          </TabsTrigger>
          <TabsTrigger value="minhas-respostas" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Minhas Respostas</span>
            <span className="sm:hidden">Respostas</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Eventos Ativos */}
        <TabsContent value="eventos-ativos">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-4 bg-secondary/50 px-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-medium">Eventos Ativos</CardTitle>
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
              {isLoading.ativos ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Carregando eventos...</p>
                </div>
              ) : filteredEventosAtivos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[180px]">Data do Evento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventosAtivos.map((evento) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Nenhum evento ativo encontrado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Meus Eventos */}
        <TabsContent value="meus-eventos">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-4 bg-secondary/50 px-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-medium">Meus Eventos</CardTitle>
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
              {isLoading.meus ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Carregando eventos...</p>
                </div>
              ) : filteredMeusEventos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[180px]">Data do Evento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeusEventos.map((evento) => (
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
                        <TableCell>
                          <Badge
                            className={
                              evento.state === 1
                                ? "bg-green-100 text-green-800"
                                : evento.state === 2
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {evento.state === 1
                              ? "Aprovado"
                              : evento.state === 2
                                ? "Pendente"
                                : "Rejeitado"}
                          </Badge>
                        </TableCell>
                        <TableCell>{evento.event_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Você ainda não criou nenhum evento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Minhas Respostas */}
        <TabsContent value="minhas-respostas">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-4 bg-secondary/50 px-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg font-medium">Minhas Respostas</CardTitle>
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
              {isLoading.respostas ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Carregando eventos...</p>
                </div>
              ) : filteredMinhasRespostas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead className="w-[150px]">Localização</TableHead>
                      <TableHead className="w-[150px]">Minha Resposta</TableHead>
                      <TableHead className="w-[180px]">Data do Evento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMinhasRespostas.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell className="font-medium">{evento.id}</TableCell>
                        <TableCell>
                          <Link href={`/forum/${evento.event.id}`} className="hover:underline">
                            {evento.event.title}
                          </Link>
                        </TableCell>
                        <TableCell>{evento.event.location}</TableCell>
                        <TableCell>{getRespostaBadge(evento.answer)}</TableCell>
                        <TableCell>{evento.event.event_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Você ainda não respondeu a nenhum evento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
