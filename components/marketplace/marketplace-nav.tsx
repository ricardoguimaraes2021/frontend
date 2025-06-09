"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

// Função para obter o token do cookie
const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export function MarketplaceNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => console.error("Erro ao obter Utilizador:", err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])


  const items = [
    {
      title: "Anúncios",
      href: "/marketplace",
    },
    {
      title: "Meus Anúncios",
      href: "/marketplace/meus-anuncios",
    },
    {
      title: "Favoritos",
      href: "/marketplace/favoritos",
    },
    {
      title: "Mensagens",
      href: "/marketplace/mensagens",
    },
    user && user.role <= 2 && {
      title: "Aprovar Anúncios",
      href: "/marketplace/aprovar",
    },
  ].filter(Boolean)

  if (loading) {
    return null
  }

  return (
    <NavigationMenu className="mb-6">
      <NavigationMenuList className="flex space-x-2">
        {items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.href && "bg-accent text-accent-foreground",
                  "cursor-pointer"
                )}
              >
                {item.title}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
