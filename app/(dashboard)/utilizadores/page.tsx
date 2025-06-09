"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { toast } from "sonner" 

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

function formatDate(isoString: string) {
  if (!isoString) return "-"
  const date = new Date(isoString)
  return date.toLocaleDateString("pt-PT")
}

export default function UtilizadoresPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = getAuthToken()
        if (!token) {
          console.warn("Token não encontrado, redirecionando para o login...")
          router.push("/login")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getAllUsers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erro ao carregar utilizadores.")
        }

        const data = await response.json()
        if (data.userRole > 2) {
          router.push("/dashboard")
        }
        else{
          setUsers(data.user)
        }

        if (!data.user) {
          throw new Error("Nenhum utilizador encontrado na API.")
        }

        
      } catch (error) {
        console.error("Erro ao encontrar utilizadores:", error)
        setError("Falha ao carregar utilizadores.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const token = getAuthToken()
      if (!token) {
        console.warn("Token não encontrado, redirecionando para o login...")
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/${selectedUser}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorMessage = "Erro ao eliminar utilizador.";
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || "Não é possível eliminar a sua própria conta.";
          } catch (e) {
          }
        }

        setIsAlertOpen(false);
        toast.error(errorMessage); 
        return;
      }

      setUsers(users.filter(user => user.id !== selectedUser));
      setIsAlertOpen(false);
      toast.success("Utilizador eliminado com sucesso!"); 

    } catch (error) {
      console.error("Erro ao eliminar utilizador:", error);
      setIsAlertOpen(false);
      toast.error("Falha ao eliminar utilizador."); 
    } finally {
      setSelectedUser(null);
    }
  }

  return (
    <div className="space-y-8">

      <div className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Utilizadores</h1>
          <p className="text-muted-foreground">Gestão de utilizadores.</p>
        </div>
        <Button asChild>
          <Link href="/utilizadores/adicionar">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Link>
        </Button>
      </div>

      <Separator />

      <Card className="overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-secondary/50 px-6">
          <CardTitle className="text-lg font-medium">Lista de Utilizadores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-6 text-gray-500">Carregando utilizadores...</p>
          ) : error ? (
            <p className="text-center py-6 text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Nenhum utilizador encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Porta</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[150px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name ?? "Sem Nome"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.house_number ?? "-"}</TableCell>
                    <TableCell>{formatDate(user.dob)}</TableCell>
                    <TableCell>{user.active ? "Ativo" : "Inativo"}</TableCell>
                    <TableCell className="flex gap-2 justify-center">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/utilizadores/${user.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setIsAlertOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza que deseja eliminar o utilizador?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}