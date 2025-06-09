"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserFormProps {
  title: string
  initialData?: {
    nome?: string
    rua?: string
    dataNascimento?: string
    nif?: string
  }
  onSubmit: (data: FormData) => void
}

export function UserForm({ title, initialData, onSubmit }: UserFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              onSubmit(formData)
            }}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" defaultValue={initialData?.nome} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rua">Rua</Label>
                <Input id="rua" name="rua" defaultValue={initialData?.rua} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data Nascimento</Label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  defaultValue={initialData?.dataNascimento}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">Nif</Label>
                <Input id="nif" name="nif" defaultValue={initialData?.nif} required />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

