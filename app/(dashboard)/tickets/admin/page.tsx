"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Função para obter o token de autenticação
const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

// Interface para o tipo Ticket
interface Ticket {
  id: number
  title: string
  description: string
  status: string
  status_id: number
  created_at: string
  updated_at: string
  created_by: number
  creator_name: string
  solve_by: number | null
  solver_name: string | null
  assigned_to?: number | null
}

// Interface para o tipo User
interface User {
  id: number
  name: string
  email: string
  role: number
}

export default function AdminTicketsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  // Função para buscar o Utilizador atual
  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar informações do Utilizador.")
      }

      const userData = await response.json()
      setCurrentUser(userData)

      // Verificar se o Utilizador tem permissão para acessar esta página
      if (userData.role > 2) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        })
        router.push("/tickets")
      }
    } catch (err: any) {
      console.error("Erro ao buscar Utilizador:", err)
      toast({
        title: "Erro ao carregar informações do Utilizador",
        description: err.message || "Não foi possível carregar as informações do Utilizador.",
        variant: "destructive",
      })
    }
  }

  // Função para buscar todos os Utilizadors
  const fetchUsers = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getAllUsersActive`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar Utilizadors.")
      }

      const data = await response.json()
      setUsers(data)
    } catch (err: any) {
      console.error("Erro ao buscar Utilizadors:", err)
    }
  }

  // Função para buscar todos os tickets
  const fetchTickets = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError("Sessão expirada. Faça login novamente.")
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/getAll`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar tickets.")
      }

      const data = await response.json()
      setTickets(data)
      setFilteredTickets(data)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Erro ao carregar tickets",
        description: err.message || "Não foi possível carregar os tickets. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Buscar Utilizador, Utilizadors e tickets ao carregar a página
  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
    fetchTickets()
  }, [])

  // Filtrar tickets quando o termo de pesquisa ou filtros mudarem
  useEffect(() => {
    let filtered = tickets

    // Filtrar por termo de pesquisa
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.id.toString().includes(searchTerm) ||
          ticket.creator_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status_id === Number.parseInt(statusFilter))
    }

    // Filtrar por Utilizador
    if (userFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.created_by === Number.parseInt(userFilter))
    }

    setFilteredTickets(filtered)
  }, [searchTerm, statusFilter, userFilter, tickets])

  // Função para exportar tickets para CSV
  const exportToCSV = () => {
    // Cabeçalhos do CSV
    const headers = ["ID", "Título", "Status", "Criado por", "Data de Abertura", "Resolvido por", "Data de Resolução"]

    // Dados do CSV
    const csvData = filteredTickets.map((ticket) => [
      ticket.id,
      ticket.title,
      ticket.status || "Aberto",
      ticket.creator_name,
      new Date(ticket.created_at).toLocaleDateString("pt-PT"),
      ticket.solver_name || "",
      ticket.solve_by ? new Date(ticket.updated_at).toLocaleDateString("pt-PT") : "",
    ])

    // Juntar cabeçalhos e dados
    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `tickets_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-PT")
  }

  // Função para renderizar o badge de status
  const renderStatusBadge = (statusId: number) => {
    switch (statusId) {
      case 3: // Fechado
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolvido</Badge>
      case 2: // Em andamento
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Em andamento</Badge>
      case 1: // Aberto
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Aberto</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4 max-w-md mx-auto border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Button onClick={fetchTickets}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração de Tickets</h1>
          <p className="text-muted-foreground">Gerencie todos os tickets do sistema.</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todos os Tickets</CardTitle>
          <CardDescription>Visualize e gerencie todos os tickets do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por título, ID ou Utilizador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-2/3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="1">Aberto</SelectItem>
                  <SelectItem value="2">Em andamento</SelectItem>
                  <SelectItem value="3">Resolvido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Filtrar por Utilizador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Utilizadors</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Nenhum ticket encontrado.</p>
              <p className="text-sm text-gray-400">Tente ajustar os filtros ou pesquisar por outro termo.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead className="w-[150px]">Data de Abertura</TableHead>
                    <TableHead className="w-[150px]">Resolvido por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>{renderStatusBadge(ticket.status_id || 1)}</TableCell>
                      <TableCell>{ticket.creator_name}</TableCell>
                      <TableCell>{formatDate(ticket.created_at)}</TableCell>
                      <TableCell>{ticket.solver_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

