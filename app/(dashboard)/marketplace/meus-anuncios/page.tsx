"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusCircle, Pencil, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";

export default function MeusAnunciosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = getAuthToken(); 
        if (!token) {
          setError("Sessão expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/meusanuncios`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar anúncios.");
        }

        const data = await response.json();
        setProducts(data.ads || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/);
    return match ? match[2] : null;
  };

  const handleDelete = async (productId: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/deleteAd`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: productId }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao remover anúncio.");
      }
  
      setProducts(products.filter((product) => product.ad.id !== productId));
    } catch (err: any) {
      setError(err.message);
    }
  };
  

  const toggleStatus = async (productId: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/marksell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: productId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do anúncio.");
      }

      setProducts(
        products.map((product) =>
          product.ad.id === productId
            ? { ...product, ad: { ...product.ad, status: product.ad.status.name === "active" ? "sold" : "active" } }
            : product
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meus Anúncios</h1>
        <Button asChild>
          <Link href="/marketplace/adicionar">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Link>
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500">A carregar anúncios...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && products?.length === 0 && (
        <p className="text-center text-gray-500">Nenhum anúncio encontrado.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.ad.id} className="overflow-hidden">
            <div className="aspect-video w-full overflow-hidden">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.ad.title}
                width={300}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="line-clamp-1 font-medium mb-1">{product.ad.title}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-primary">{product.ad.price}€</p>
                    <Badge variant={product.ad.status === "sold" ? "secondary" : "outline"}>
                      {product.ad.status.name}
                    </Badge>
                  </div>
                </div>
                {product.ad.status_id === 2 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Abrir menu</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/marketplace/${product.ad.id}/editar`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(product.ad.id)} className="flex items-center">
                        <Check className="mr-2 h-4 w-4" />
                        <span>Marcar como vendido</span>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="flex items-center text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Remover</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover anúncio</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este anúncio? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.ad.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
