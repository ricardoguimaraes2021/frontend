    // app/(auth)/definir-password/DefinirPasswordForm.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DefinirPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.push("/404")
      return
    }

    const checkToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/verificar-token/${token}`)
        if (!response.ok) {
          router.push("/404")
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Erro ao validar token:", error)
        router.push("/404")
      }
    }

    checkToken()
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/definir-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao definir nova password.")
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (err: any) {
      setError(err.message || "Erro ao definir nova password.")
    }
  }

  if (loading) return <p className="text-center text-gray-500">A validar token...</p>

  return (
    <>
      <h1 className="mb-8 text-center text-2xl font-semibold">Definir Password</h1>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Repetir Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" className="w-full bg-[#5b9af5] hover:bg-[#4a8ae5]">
            Confirmar
          </Button>
        </form>
      ) : (
        <div className="rounded-md bg-green-50 p-4 text-center text-green-800">
          Password alterada com sucesso! A redirecionar para o login...
        </div>
      )}
    </>
  )
}