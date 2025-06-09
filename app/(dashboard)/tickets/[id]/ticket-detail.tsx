"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Trash2, CheckCircle, XCircle, Plus, FileText, ArrowLeft } from "lucide-react"

type TicketType = {
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
  logs?: TicketLogType[]
  external_budgets?: ExternalBudgetType[]
}

type TicketLogType = {
  id: number
  ticket_id: number
  state_id: number
  state_name: string
  solution: string | null
  updated_by: number
  user_name: string
  updated_at: string
  created_at: string
  state: {
    id: number
    name: string
  }
  updated_by: {
    name: string
  }
}

type ExternalBudgetType = {
  id: number
  ticket_id: number
  company_name: string
  budget_amount: number
  description: string
  status: "pending" | "approved" | "rejected"
  created_by: number
  created_at: string
}

type UserType = {
  id: number
  name: string
  email: string
  role: number
}

export default function TicketDetail({ id }: { id: string }) {
  const ticketId = Number.parseInt(id)
  const [ticket, setTicket] = useState<TicketType | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined)
  const [comment, setComment] = useState<string>("")
  const [userRole, setUserRole] = useState<number>(4)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [showBudgetDialog, setShowBudgetDialog] = useState<boolean>(false)
  const [budgetCompany, setBudgetCompany] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [budgetDescription, setBudgetDescription] = useState<string>("")
  const [budgetNif, setBudgetNif] = useState<string>("")

  const router = useRouter()

  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }

  const fetchUserRole = async () => {
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
        throw new Error("Erro ao obter informações do Utilizador.")
      }

      const userData = await response.json()
      setUserRole(userData.role)
    } catch (err: any) {
      console.error("Erro ao buscar papel do Utilizador:", err)
    }
  }

  const fetchTicket = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/getTicketById/${ticketId}`, {
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
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.message || "Erro ao buscar ticket.")
        } catch (e) {
          throw new Error(errorText || "Erro ao buscar ticket.")
        }
      }

      const responseText = await response.text()
      if (!responseText.trim()) {
        setTicket(null)
        return
      }

      try {
        const data = JSON.parse(responseText)
        setTicket(data)

        if (data.assigned_to) {
          setSelectedUser(data.assigned_to.toString())
        }
      } catch (e) {
        throw new Error("Erro ao processar a resposta da API.")
      }
    } catch (err: any) {
      console.error("Erro ao buscar ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao buscar ticket.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.")
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getZeladoresActive`, {
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

        const responseText = await response.text()
        if (!responseText.trim()) {
          setUsers([])
          return
        }

        try {
          const data = JSON.parse(responseText)
          if (Array.isArray(data)) {
            setUsers(data)
          } else if (data && typeof data === "object") {
            const usersArray = Object.values(data).find(Array.isArray)
            if (usersArray) {
              setUsers(usersArray)
            } else {
              setUsers([])
            }
          } else {
            setUsers([])
          }
        } catch (e) {
          console.error("Erro ao processar dados de Utilizadors:", e)
          setUsers([])
        }
      } catch (err: any) {
        console.error("Erro ao buscar Utilizadors:", err)
        setUsers([])
      }
    }

    fetchUserRole()
    fetchTicket().then(() => {
      if (ticket && ticket.assigned_to) {
        setSelectedUser(ticket.assigned_to.toString())
      }
    })
    fetchUsers()
  }, [ticketId])

  const handleAssignTicket = async () => {
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um utilizador para atribuir o ticket.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_to: Number.parseInt(selectedUser) }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atribuir ticket.")
      }

      toast({
        title: "Sucesso!",
        description: "Ticket atribuído com sucesso.",
      })

      fetchTicket()
      router.refresh()
    } catch (err: any) {
      console.error("Erro ao atribuir ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao atribuir ticket.",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!comment) {
      toast({
        title: "Erro",
        description: "Adicione um comentário.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/${ticketId}/addComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar comentário.")
      }

      toast({
        title: "Sucesso!",
        description: "Comentário adicionado com sucesso.",
      })

      setComment("")
      fetchTicket()
    } catch (err: any) {
      console.error("Erro ao adicionar comentário:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao adicionar comentário.",
        variant: "destructive",
      })
    }
  }

  const handleCloseTicket = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/closeTicket/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 3, // Status "Fechado"
          solution: "Ticket resolvido e fechado.",
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao fechar ticket.")
      }

      toast({
        title: "Sucesso!",
        description: "Ticket fechado com sucesso.",
      })

      fetchTicket()
    } catch (err: any) {
      console.error("Erro ao fechar ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao fechar ticket.",
        variant: "destructive",
      })
    }
  }

  // Função para excluir ticket
  const handleDeleteTicket = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/deleteTicket/${ticketId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir ticket.")
      }

      toast({
        title: "Sucesso!",
        description: "Ticket excluído com sucesso.",
      })

      // Redirecionar para a lista de tickets
      router.push("/tickets")
    } catch (err: any) {
      console.error("Erro ao excluir ticket:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir ticket.",
        variant: "destructive",
      })
    }
  }

  const handleAddExternalBudget = async () => {
    if (!budgetCompany || !budgetAmount || !budgetDescription || !budgetNif) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos do orçamento.",
        variant: "destructive",
      })
      return
    }

    // Validar o formato do NIF (9 dígitos)
    if (!/^\d{9}$/.test(budgetNif)) {
      toast({
        title: "Erro",
        description: "O NIF deve conter exatamente 9 dígitos numéricos.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/${ticketId}/addExternalBudget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: budgetCompany,
          nif: budgetNif, // Enviar o NIF como campo separado
          budget_amount: Number.parseFloat(budgetAmount),
          description: budgetDescription,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar orçamento externo.")
      }

      toast({
        title: "Sucesso!",
        description: "Orçamento externo adicionado com sucesso.",
      })

      // Limpar campos e fechar diálogo
      setBudgetCompany("")
      setBudgetAmount("")
      setBudgetDescription("")
      setBudgetNif("")
      setShowBudgetDialog(false)

      // Recarregar os dados do ticket
      fetchTicket()
    } catch (err: any) {
      console.error("Erro ao adicionar orçamento externo:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao adicionar orçamento externo.",
        variant: "destructive",
      })
    }
  }

  // Função para aprovar/rejeitar orçamento
  const handleBudgetAction = async (budgetId: number, action: "approve" | "reject") => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.")
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets/${ticketId}/gerirExternalBudget`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: action === "approve" ? 1 : 2,
          budgetId: budgetId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao ${action === "approve" ? "aprovar" : "rejeitar"} orçamento.`)
      }

      toast({
        title: "Sucesso!",
        description: `Orçamento ${action === "approve" ? "aprovado" : "rejeitado"} com sucesso.`,
      })

      // Recarregar os dados do ticket
      fetchTicket()
    } catch (err: any) {
      console.error(`Erro ao ${action === "approve" ? "aprovar" : "rejeitar"} orçamento:`, err)
      toast({
        title: "Erro",
        description: err.message || `Erro ao ${action === "approve" ? "aprovar" : "rejeitar"} orçamento.`,
        variant: "destructive",
      })
    }
  }

  // Função para filtrar logs com base na pesquisa
  /*const filteredLogs =
    ticket?.logs?.filter(
      (log) =>
        log.solution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.state_name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []*/

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  if (!ticket) {
    return <div className="flex justify-center items-center h-64">Ticket não encontrado</div>
  }

  const isAdmin = userRole <= 2

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/tickets")} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Tickets
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription>Detalhes do ticket</CardDescription>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={handleCloseTicket} disabled={ticket.solver}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Fechar Ticket
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={ticket.solver}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o ticket e todos os seus dados
                        associados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTicket}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium leading-none">Descrição</p>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium leading-none">Status</p>
              <Badge
                variant={
                  ticket.logs[0].state.id === 1 ? "default" : ticket.logs[0].state.id === 2 ? "secondary" : "outline"
                }
                className={ticket.logs[0].state.id === 3 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
              >
                {ticket.logs[0].state.name}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium leading-none">Criado por</p>
              <p className="text-sm text-muted-foreground">{ticket.creator.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium leading-none">Criado em</p>
              <p className="text-sm text-muted-foreground">{new Date(ticket.created_at).toLocaleString("pt-PT")}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium leading-none">Atualizado em</p>
              <p className="text-sm text-muted-foreground">{new Date(ticket.updated_at).toLocaleString("pt-PT")}</p>
            </div>
            <Separator />

            {/* Seção de atribuição de ticket - apenas para administradores */}
            {isAdmin && ticket.status_id !== 3 && (
              <>
                <div>
                  <p className="text-sm font-medium leading-none">Atribuir Ticket</p>
                  <div className="flex gap-2 mt-2">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione um zelador" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(users) && users.length > 0 ? (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users" disabled>
                            Nenhum utilizador disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignTicket}>Atribuir</Button>
                  </div>
                  {ticket.assigned_to && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Atualmente atribuído a:{" "}
                      {users.find((user) => user.id === ticket.assigned_to)?.name || "Utilizador desconhecido"}
                    </p>
                  )}
                </div>
                <Separator />
              </>
            )}

            {userRole <= 3 && ticket.status_id !== 3 && (
              <>
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium leading-none">Orçamentos Externos</p>
                    <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Orçamento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Orçamento Externo</DialogTitle>
                          <DialogDescription>
                            Preencha os detalhes do orçamento externo para este ticket.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">
                              Empresa
                            </Label>
                            <Input
                              id="company"
                              value={budgetCompany}
                              onChange={(e) => setBudgetCompany(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nif" className="text-right">
                              NIF
                            </Label>
                            <Input
                              id="nif"
                              value={budgetNif}
                              onChange={(e) => setBudgetNif(e.target.value)}
                              placeholder="123456789"
                              maxLength={9}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Valor (€)
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={budgetAmount}
                              onChange={(e) => setBudgetAmount(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              Descrição
                            </Label>
                            <Textarea
                              id="description"
                              value={budgetDescription}
                              onChange={(e) => setBudgetDescription(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleAddExternalBudget}>
                            Adicionar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {ticket.external_budgets && ticket.external_budgets.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {ticket.external_budgets.map((budget) => (
                        <Card key={budget.id} className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{budget.company_name}</p>
                              <p className="text-sm text-muted-foreground">{budget.description}</p>
                              <p className="text-sm font-medium mt-1">
                                {typeof budget.budget_amount === "number"
                                  ? budget.budget_amount.toFixed(2)
                                  : Number(budget.budget_amount).toFixed(2)}
                                €
                              </p>
                            </div>
                            <div>
                              <Badge
                                variant={
                                  budget.status === "pending"
                                    ? "outline"
                                    : budget.status === "approved"
                                      ? "outline"
                                      : "destructive"
                                }
                                className={
                                  budget.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                                }
                              >
                                {budget.status === "pending"
                                  ? "Pendente"
                                  : budget.status === "approved"
                                    ? "Aprovado"
                                    : "Rejeitado"}
                              </Badge>

                              {budget.status === "pending" && isAdmin && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                    onClick={() => handleBudgetAction(budget.id, "approve")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2"
                                    onClick={() => handleBudgetAction(budget.id, "reject")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum orçamento externo adicionado.</p>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Histórico de atividades com pesquisa */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium leading-none">Histórico de Atividades</p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar no histórico..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 w-[200px]"
                  />
                </div>
              </div>

              {ticket.logs && ticket.logs.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {ticket.logs
                    .filter(
                      (log) =>
                        !searchQuery ||
                        log.solution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.updated_by.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.state.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={log.state_id === 1 ? "default" : log.state_id === 2 ? "secondary" : "outline"}
                                className={log.state_id === 3 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                              >
                                {log.state.name}
                              </Badge>
                              <span className="text-sm font-medium">{log.updated_by.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString("pt-PT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{log.solution}</p>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma atividade registrada.</p>
              )}
            </div>

            {/* Adicionar comentário - disponível para todos os Utilizadors se o ticket não estiver fechado */}
            {ticket.status_id !== 3 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium leading-none">Adicionar Comentário</p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escreva seu comentário aqui."
                    className="mt-2"
                  />
                  <Button onClick={handleAddComment} className="mt-2">
                    <FileText className="mr-2 h-4 w-4" />
                    Adicionar Comentário
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
