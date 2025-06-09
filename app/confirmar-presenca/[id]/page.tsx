"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ArrowLeft, XCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

export default function ConfirmarPresencaPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("erro")
  const [loading, setLoading] = useState(true)
  const [evento, setEvento] = useState<any>(null)

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(^| )authToken=([^;]+)/)
      return match ? match[2] : null
    }
    return null
  }


  useEffect(() => {
    if (!id) return
    const token = getAuthToken()
    if(!token){
      setActiveTab("erro")
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${redirectUrl}`)
    }

    const confirmarPresenca = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/presentEvent/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventoId: id }),
        })

        const data = await res.json()
        if (!res.ok || data?.erro) {
          setActiveTab("erro")
        } else {
          setActiveTab("sucesso")
        }
      } catch (err) {
        console.error(err)
        setActiveTab("erro")
      } finally {
        setLoading(false)
      }
    }

    confirmarPresenca()
  }, [id])

  useEffect(() => {
    if (activeTab === "sucesso") {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [activeTab])

  if (loading) {
    return <div className="text-center mt-10">A confirmar presença...</div>
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="sucesso">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6,
              }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-2 text-3xl font-bold tracking-tight"
            >
              Presença Confirmada!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-8 text-muted-foreground"
            >
              {evento?.nome
                ? `Sua presença no evento "${evento.nome}" foi confirmada.`
                : "Sua presença no evento foi registada com sucesso."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Button asChild className="w-full">
                <Link href="/forum">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Fórum
                </Link>
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="erro">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6,
              }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100"
            >
              <XCircle className="h-12 w-12 text-red-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-2 text-3xl font-bold tracking-tight"
            >
              Algo correu mal
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-8 text-muted-foreground"
            >
              Não foi possível confirmar sua presença. Tente novamente mais tarde.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button variant="outline" className="w-full" onClick={() => router.refresh()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button asChild className="w-full">
                <Link href="/forum">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Fórum
                </Link>
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
