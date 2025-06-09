"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/);
  return match ? match[2] : null;
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [userID, setUserID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [visibleProducts, setVisibleProducts] = useState(6);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError("Sessão expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/anuncios`, {
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
        const ads = data.ads || [];
        setProducts(ads);
        setUserID(data.userID);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/getmyfavorites`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar favoritos.");
        }

        const data = await response.json();
        const favoriteAdIds = data.favorites.map((favorites: any) => favorites.ad.id);
        setFavorites(favoriteAdIds);
      } catch (err: any) {
        // setError(err.message);
      }
    };

    fetchFavorites();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar categorias.");
        }

        const data = await response.json();
        setCategories(data.categories);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchCategories();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getAuthToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/addfavorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: productId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar aos favoritos.");
      }

      const updatedFavorites = isFavorite(productId)
        ? favorites.filter((id) => id !== productId)
        : [...favorites, productId];
      setFavorites(updatedFavorites);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isFavorite = (productId: number) => favorites.includes(productId);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.ad.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const loadMoreProducts = () => {
    setVisibleProducts((prev) => prev + 6);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop ===
        document.documentElement.offsetHeight
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        <div className="ml-auto">
          <Select onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Carregando anúncios...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && filteredProducts.length === 0 && (
        <p className="text-center text-gray-500">Nenhum anúncio encontrado.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.slice(0, visibleProducts).map((product) => (
          <Link
            key={product.ad.id}
            href={`/marketplace/${product.ad.id}`}
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <Card className="h-full overflow-hidden cursor-pointer relative">
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
                    <p className="font-bold text-primary">{product.ad.price}€</p>
                  </div>
                  {product.ad.created_by !== userID && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full",
                        isFavorite(product.ad.id)
                          ? "text-red-500 hover:text-red-600"
                          : "text-muted-foreground hover:text-red-400"
                      )}
                      onClick={(e) => toggleFavorite(e, product.ad.id)}
                    >
                      <Heart className={cn("h-7 w-7", isFavorite(product.ad.id) ? "fill-current" : "")} />
                      <span className="sr-only">
                        {isFavorite(product.ad.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      </span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {visibleProducts < filteredProducts.length && (
        <div className="flex justify-center">
          <Button onClick={loadMoreProducts} className="mt-4">
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
}
