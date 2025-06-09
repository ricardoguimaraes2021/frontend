"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }
  return null
}

interface Role {
  id: number;
  name: string;
}

interface House {
  id: number;
  number: string;
}

interface FormErrors {
  name?: string[];
  email?: string[];
  house_number?: string[];
  dob?: string[];
  nif?: string[];
  [key: string]: string[] | undefined;
}

export default function AdicionarUtilizadorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    house_number: "",
    dob: "",
    nif: "",
    role: "",
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  useEffect(() => {
    async function fetchRoles() {
      const token = getAuthToken()
      if (!token) {
        console.error("Token de autenticação não encontrado.")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getRoles`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.userRole > 2) {
          router.push("/dashboard")
        }
        else{
          setRoles(Array.isArray(data.roles) ? data.roles : [])
        }
      } catch (error) {
        console.error("Erro ao carregar roles:", error)
        setRoles([])
      }
    }

    async function fetchHouses() {
      const token = getAuthToken()
      if (!token) {
        console.error("Token de autenticação não encontrado.")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getHousesNumber`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        setHouses(data.houseNumbers || [])
      } catch (error) {
        console.error("Erro ao carregar números de casa:", error)
        setHouses([])
      }
    }

    fetchRoles()
    fetchHouses()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({}) 
    const authToken = getAuthToken()

    if (!authToken) {
      toast.error("Autenticação necessária. Por favor, faça login.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 422) {
          setFormErrors(responseData.errors as FormErrors)
          toast.error("Por favor, corrija os erros no formulário.")
        } else {
          throw new Error(responseData.message || "Erro ao adicionar utilizador")
        }
        return
      }

      toast.success("Utilizador adicionado com sucesso!")
      setTimeout(() => router.push("/utilizadores"), 1500)

    } catch (error) {
      console.error("Erro:", error)
      toast.error(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Adicionar Utilizador</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Utilizador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: João Silva"
                  required
                />
                {formErrors.name && formErrors.name.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: joao@example.com"
                  required
                />
                {formErrors.email && formErrors.email.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="house_number">Número de Porta</Label>
                <Select
                  value={formData.house_number}
                  onValueChange={(value) => handleSelectChange('house_number', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o número da casa">
                      {formData.house_number ? formData.house_number : "Selecione o número da casa"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.number.toString()}>
                        {house.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.house_number && formErrors.house_number.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Data de Nascimento</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                />
                {formErrors.dob && formErrors.dob.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  name="nif"
                  type="number"
                  value={formData.nif}
                  onChange={handleChange}
                  placeholder="Ex: 123456789"
                />
                {formErrors.nif && formErrors.nif.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o role do utilizador" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && formErrors.role.map((error) => (
                  <p key={error} className="text-sm text-red-500">{error}</p>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/utilizadores")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "A guardar..." : "Adicionar Utilizador"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
