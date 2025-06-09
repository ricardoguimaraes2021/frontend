"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus } from "lucide-react"

interface ExternalBudgetFormProps {
  ticketId: number
  onSuccess: () => void
  getAuthToken: () => string | null
}

export function ExternalBudgetForm({ ticketId, onSuccess, getAuthToken }: ExternalBudgetFormProps) {
  const [showBudgetDialog, setShowBudgetDialog] = useState<boolean>(false)
  const [budgetCompany, setBudgetCompany] = useState<string>("")
  const [budgetNif, setBudgetNif] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [budgetDescription, setBudgetDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

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
      setIsSubmitting(true)
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

      // Notificar o componente pai sobre o sucesso
      onSuccess()
    } catch (err: any) {
      console.error("Erro ao adicionar orçamento externo:", err)
      toast({
        title: "Erro",
        description: err.message || "Erro ao adicionar orçamento externo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
          <DialogDescription>Preencha os detalhes do orçamento externo para este ticket.</DialogDescription>
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
          <Button type="submit" onClick={handleAddExternalBudget} disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

