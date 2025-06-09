"use client"

import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Tag, User } from "lucide-react"
import type { Anuncio } from "./columns"

interface AnuncioDetailsDialogProps {
  anuncio: Anuncio
  open: boolean
  onOpenChange: (open: boolean) => void
  onAprovar: () => void
  onRejeitar: () => void
}

export function AnuncioDetailsDialog({
  anuncio,
  open,
  onOpenChange,
  onAprovar,
  onRejeitar,
}: AnuncioDetailsDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string>(anuncio.imagens[0] || "")
  const [isAprovando, setIsAprovando] = useState(false)
  const [isRejeitando, setIsRejeitando] = useState(false)

  const handleAprovar = () => {
    setIsAprovando(true)

    // Mostrar toast de confirmação
    toast.promise(
      new Promise<void>((resolve) => {
        // Simular um pequeno atraso para mostrar o estado de carregamento
        setTimeout(() => {
          onAprovar()
          resolve()
        }, 500)
      }),
      {
        loading: "Aprovando anúncio...",
        success: () => {
          setIsAprovando(false)
          return "Anúncio aprovado com sucesso!"
        },
        error: () => {
          setIsAprovando(false)
          return "Erro ao aprovar anúncio"
        },
      },
    )
  }

  const handleRejeitar = () => {
    setIsRejeitando(true)

    // Mostrar toast de confirmação
    toast.promise(
      new Promise<void>((resolve) => {
        // Simular um pequeno atraso para mostrar o estado de carregamento
        setTimeout(() => {
          onRejeitar()
          resolve()
        }, 500)
      }),
      {
        loading: "Rejeitando anúncio...",
        success: () => {
          setIsRejeitando(false)
          return "Anúncio rejeitado com sucesso!"
        },
        error: () => {
          setIsRejeitando(false)
          return "Erro ao rejeitar anúncio"
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{anuncio.titulo}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Pendente</Badge>
            <DialogDescription className="m-0">ID: {anuncio.id}</DialogDescription>
          </div>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="mt-4">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="imagens">Imagens</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Informações do Anúncio</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Categoria: {anuncio.categoria}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estado: {anuncio.estado}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Data: {anuncio.dataCriacao}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Informações do Vendedor</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vendedor: {anuncio.vendedor}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Preço</h3>
              <p className="text-2xl font-bold">{anuncio.preco}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Descrição</h3>
              <p className="text-sm whitespace-pre-line">{anuncio.descricao}</p>
            </div>
          </TabsContent>

          <TabsContent value="imagens">
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-white">
                <Image
                  src={selectedImage || "/placeholder.svg?height=400&width=600"}
                  alt={anuncio.titulo}
                  fill
                  className="object-contain"
                />
              </div>

              {anuncio.imagens.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {anuncio.imagens.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                        selectedImage === image ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg?height=80&width=80"}
                        alt={`${anuncio.titulo} - Imagem ${index + 1}`}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={handleRejeitar} disabled={isRejeitando || isAprovando}>
            {isRejeitando ? "Rejeitando..." : "Rejeitar Anúncio"}
          </Button>
          <Button onClick={handleAprovar} disabled={isAprovando || isRejeitando}>
            {isAprovando ? "Aprovando..." : "Aprovar Anúncio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

