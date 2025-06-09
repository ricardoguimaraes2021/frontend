"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export default function AdicionarProdutoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "",
    category: "",
  })
  const [images, setImages] = useState<File[]>([])
  const [productConditions, setProductConditions] = useState<{ id: number; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const authToken = getAuthToken()
      if (!authToken) return

      try {
        const statesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/product-states`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        const statesData = await statesResponse.json()

        if (Array.isArray(statesData.productsState)) {
          setProductConditions(statesData.productsState)
        } else {
          console.error("A resposta de estados não é um array", statesData)
        }

        const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/categories`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        const categoriesData = await categoriesResponse.json()

        if (Array.isArray(categoriesData.categories)) {
          setCategories(categoriesData.categories)
        } else {
          console.error("A resposta de categorias não é um array", categoriesData)
        }
      } catch (error) {
        console.error("Erro ao carregar dados da API", error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setImages((prev) => [...prev, ...Array.from(files)])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const authToken = getAuthToken()

    if (!authToken) return

    const formDataToSend = new FormData()
    formDataToSend.append("title", formData.title)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("price", formData.price)
    formDataToSend.append("state_product_id", formData.condition)
    formDataToSend.append("category_id", formData.category)

    images.forEach((image) => {
      formDataToSend.append("images[]", image)
    })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/anuncio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      const responseData = await response.json()

      if (response.ok) {
        toast.success(responseData.message || "Anúncio criado com sucesso!")
        setTimeout(() => {
          router.push("/marketplace")
        }, 3000)
      } else {
        toast.error(responseData.message || "Erro ao criar o anúncio. Tente novamente.")
        console.error("Erro ao criar anúncio:", responseData)
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor")
      console.error("Erro ao enviar dados", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Adicionar Produto</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Anúncio</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Sofá de 3 lugares em excelente estado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o produto em detalhes, incluindo características, estado, etc."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (€)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ex: 99.99"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Estado</Label>
                <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)} required>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Selecione o estado do produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productConditions.map((condition) => (
                      <SelectItem key={condition.id} value={condition.id.toString()}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria do produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fotos do Produto</Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-md border">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`Uploaded image ${index + 1}`}
                      fill
                      className="rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/50">
                  <Upload className="mb-2 h-6 w-6" />
                  <span>Adicionar Foto</span>
                  <Input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione até 8 fotos do seu produto. A primeira foto será a capa do anúncio.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push("/marketplace")}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar Anúncio</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}