"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Pusher from "pusher-js"
import { ArrowLeft, Send, Check, CheckCheck, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type MessageStatus = "sent" | "read"

type ChatItem = {
  id: number
  type: "message" | "offer"
  created_at: string
}

type MessageItem = ChatItem & {
  type: "message"
  chat_id: number
  sent_by: number
  text: string
  read: number
  status?: MessageStatus
}

type OfferItem = ChatItem & {
  type: "offer"
  user_id: number
  offer_price: string
  status_offer_id: number
}

type ChatProps = {
  selectedConversation: number
}

let ad_id = 0
const ad_price = 0
const ad_title = ""

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/)
  return match ? match[2] : null
}

export default function Chat({ selectedConversation }: ChatProps) {
  const [chatItems, setChatItems] = useState<(MessageItem | OfferItem)[]>([])
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [offerPrice, setOfferPrice] = useState("")
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchMessages() {
      const authToken = getAuthToken()
      if (!authToken) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/chat/${selectedConversation}/messages`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) throw new Error("Erro ao carregar mensagens")

        const data = await response.json()
        ad_id = data.ad_id
        setUserId(data.userId)

        setChatItems(data.conversation)
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error)
      }
    }

    fetchMessages()
  }, [selectedConversation])

  useEffect(() => {
    if (!userId || !selectedConversation) return

    const pusher = new Pusher("35c8eb42cb694ba35f18", {
      cluster: "eu",
    })

    const channel = pusher.subscribe(`chat.${selectedConversation}`)

    channel.bind("App\\Events\\NewChatMessage", (data: any) => {
      const newMsg: MessageItem = {
        id: data.id,
        type: "message",
        chat_id: data.chat_id,
        sent_by: data.sender_id,
        text: data.message,
        read: data.sender_id === userId ? 0 : 1,
        created_at: new Date().toISOString(),
      }
      setChatItems((prev) => [...prev, newMsg])
    })

    channel.bind("MessageStatusUpdated", (data: any) => {
      console.log("Status update recebido:", data)
      setChatItems((prev) =>
        prev.map((item) => (item.type === "message" && item.id === data.message_id ? { ...item, read: 1 } : item)),
      )
    })

    // Evento para novas ofertas
    channel.bind('NewOffer', (data: any) => {
      const newOffer: OfferItem = {
          id: data.offerId,
          type: 'offer',
          user_id: data.userId,
          offer_price: data.offerPrice,
          status_offer_id: 1,
          created_at: new Date().toISOString(),
      };
      setChatItems((prev) => [...prev, newOffer]);
    });

    // Evento para atualizações de status de oferta
    channel.bind('OfferStatusUpdated', (data: any) => {
      setChatItems((prev) =>
          prev.map((item) =>
              item.type === 'offer' && item.id === data.offerId
                  ? { ...item, status_offer_id: data.statusId }
                  : item
          )
      );
    });

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [selectedConversation, userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
  
    const authToken = getAuthToken();
    if (!authToken) return;
  
    setMessage("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/sendmessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          chat_id: selectedConversation,
          anuncio_id: ad_id,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Falha ao enviar mensagem");
      }
  
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");

    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice.trim() || isNaN(Number.parseFloat(offerPrice))) {
      toast.error("Por favor, insira um valor válido")
      return
    }

    const authToken = getAuthToken()
    if (!authToken) return

    const value = Number.parseFloat(offerPrice)

    setIsOfferDialogOpen(false)
    setOfferPrice("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/sendOffer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ad_id: ad_id,
          offer_price: value.toString(),
        }),
      })

      if (response.ok) {
        toast.success("Oferta enviada com sucesso!")
      } else {
        toast.error("Erro ao enviar oferta")
      }
    } catch (error) {
      console.error("Erro ao enviar oferta:", error)
      toast.error("Erro ao enviar oferta")
    }
  }

  const handleRespondToOffer = async (offerId: number, accept: boolean) => {
    const authToken = getAuthToken()
    if (!authToken) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/marketplace/respondoffer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offer_id: offerId,
          accept: accept,
        }),
      })

      if (response.ok) {
        setChatItems((prev) =>
          prev.map((item) =>
            item.type === "offer" && item.id === offerId
              ? { ...item, status_offer_id: accept ? 2 : 3 } 
              : item,
          ),
        )
        toast.success(accept ? "Oferta aceite!" : "Oferta recusada")
      } else {
        toast.error("Erro ao responder à oferta")
      }
    } catch (error) {
      console.error("Erro ao responder à oferta:", error)
      toast.error("Erro ao responder à oferta")
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatItems])

  const MessageStatus = ({ read }: { read: number }) => {
    if (read === 0) {
      return <Check className="h-3 w-3 text-gray-400" />
    } else {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
  }

  const OfferStatusBadge = ({ statusId }: { statusId: number }) => {
    if (statusId === 1) {
      return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pendente</span>
    } else if (statusId === 2) {
      return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Aceite</span>
    } else if (statusId === 3) {
      return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Recusada</span>
    }
    return null
  }

  const renderChatItem = (item: MessageItem | OfferItem) => {
    if (item.type === "message") {
      const isUser = item.sent_by === userId
      return (
        <div key={`msg-${item.id}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <p>{item.text}</p>
            <div className="flex justify-end items-center gap-1 mt-1">
              <span className="text-xs">
                {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {isUser && <MessageStatus read={item.read} />}
            </div>
          </div>
        </div>
      )
    } else if (item.type === "offer") {
      const isUser = item.user_id === userId
      const offerValue = Number.parseFloat(item.offer_price).toFixed(2)

      return (
        <div key={`offer-${item.id}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <p>{isUser ? `Você ofereceu €${offerValue}` : `Oferta de €${offerValue}`}</p>

            <div className="mt-2 flex items-center gap-2">
              <OfferStatusBadge statusId={item.status_offer_id} />

              {!isUser && item.status_offer_id === 1 && (
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 bg-green-100 hover:bg-green-200 border-green-200"
                    onClick={() => handleRespondToOffer(item.id, true)}
                  >
                    <Check className="h-3 w-3 mr-1" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 bg-red-100 hover:bg-red-200 border-red-200"
                    onClick={() => handleRespondToOffer(item.id, false)}
                  >
                    <X className="h-3 w-3 mr-1" /> Recusar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-1 mt-1">
              <span className="text-xs">
                {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 border-b p-4">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chat com o vendedor</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatItems.map(renderChatItem)}
        <div ref={messagesEndRef} />
      </div>

      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva sua mensagem..."
            className="flex-1"
          />

          <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" title="Fazer oferta">
                <Tag className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fazer uma oferta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="offer-price">Valor da oferta (€)</Label>
                  <Input
                    id="offer-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={ad_price > 0 ? ad_price.toString() : "0.00"}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>
                {ad_price > 0 && (
                  <p className="text-sm text-muted-foreground">Preço original: €{ad_price.toFixed(2)}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSendOffer}>Enviar oferta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </div>
  )
}

