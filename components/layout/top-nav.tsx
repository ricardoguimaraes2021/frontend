"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "./sidebar-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Notification = {
  ad_chat: number
  ad_title: string
  username_chat: string
  lastmessage: string
  read: number
  sent_by: number
  date_time: string
}

type UserInfo = {
  username: string
  name?: string
  image?: string
}

export function TopNav() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const handleLogout = async () => {
    try {
      const token = getAuthToken()

      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          console.warn("Erro ao fazer logout no servidor:", await response.text())
        }
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict"

      router.push("/login")
    }
  }

  const getAuthToken = () => {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = getAuthToken()
      if (!token) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Erro ao buscar informações do Utilizador")

        const data = await response.json()
        setUserInfo(data)
      } catch (error) {
        console.error("Erro ao carregar informações do Utilizador:", error)
      }
    }

    const fetchNotifications = async () => {
      const token = getAuthToken()
      if (!token) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Erro ao buscar notificações")

        const data = await response.json()
        setNotifications(data.chatAds || [])
      } catch (error) {
        console.error("Erro ao carregar notificações:", error)
      }
    }

    fetchUserInfo()
    fetchNotifications()
  }, [])

  return (
    <div className="flex h-20 items-center justify-between border-b border-[#3a4d7a] bg-[#2c3e6a] px-6 text-white">
      <MobileSidebar />
      <div className="flex items-center gap-4 ml-auto">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-white bg-[#2c3e6a] hover:bg-[#3a4d7a] hover:text-white"
            >
              <Bell className="h-6 w-6" />
              {notifications.some((n) => n.read === 0) && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 font-semibold border-b">Notificações</div>
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled>Nenhuma notificação</DropdownMenuItem>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.ad_chat}
                  onClick={() => router.push(`/marketplace/mensagens?id=${notification.ad_chat}`)}
                  className="flex flex-col items-start space-y-1"
                >
                  <span className="text-sm font-medium">
                    {notification.username_chat} - {notification.ad_title}
                  </span>
                  <span
                    className={`text-xs ${notification.read === 0 ? "font-semibold text-black" : "text-muted-foreground"}`}
                  >
                    {notification.lastmessage}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.date_time).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 rounded-full text-white bg-[#2c3e6a] hover:bg-[#3a4d7a] hover:text-white"
            >
              <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage
                src={userInfo?.image ? `http://192.168.1.86:8000/storage/${userInfo.image}` : "/placeholder.svg"}
                alt={userInfo?.name || userInfo?.username}
              />                <AvatarFallback className="bg-[#3a4d7a] text-white">
                  {userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {userInfo?.username && (
                <span className="max-w-[100px] truncate">{userInfo.name || userInfo.username}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/perfil">Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
