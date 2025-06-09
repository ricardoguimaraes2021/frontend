"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "lucide-react"

interface UserType {
  id: number
  name: string
  email: string
  role: number
}

interface AssignTicketFormProps {
  ticketId: number
  onSubmit: (userId: number) => Promise<void>
  isSubmitting: boolean
}

// Função para obter o token de autenticação
const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export function AssignTicketForm({ ticketId, onSubmit, isSubmitting }: AssignTicketFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)

  // Função para buscar todos os Utilizadors
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        return
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
    } finally {
      setLoading(false)
    }
  }

  // Buscar Utilizadors ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedUser) return

    await onSubmit(Number.parseInt(selectedUser))
    setSelectedUser("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          Atribuir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Ticket</DialogTitle>
          <DialogDescription>Selecione um Utilizador para atribuir este ticket.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-10">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Utilizador" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedUser}>
            {isSubmitting ? "Atribuindo..." : "Atribuir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

