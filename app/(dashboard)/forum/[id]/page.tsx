"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Check, Edit, QrCode, BarChartHorizontalBig } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { use } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Evento = {
  id: number
  title: string
  event_date: string
  event_type_id: number
  event_type: { name: string }
  maximum_qty: number
  deadline_date: string
  location: string
  description: string
  confirmedParticipants: number
  presencaConfirmada: boolean
  isOwner?: boolean
  state: number
  created_by: number
}

type LoggedInUser = {
    id: number;
    name: string;
    email: string;
    role: number;
};

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }
  return null
}

function isValidDate(d: any): d is Date {
    return d instanceof Date && !isNaN(d.getTime());
}

export default function EventoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [presencaConfirmada, setPresencaConfirmada] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [isLoadingPresence, setIsLoadingPresence] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [isAuthorizedForStats, setIsAuthorizedForStats] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventoAndUser = async () => {
        setIsLoadingEvent(true); setFetchError(null);
        const token = getAuthToken();
        if (!token) { setFetchError("Token não encontrado."); setIsLoadingEvent(false); return; }
        let eventData: Evento | null = null;
        try {
            const resEvent = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/evento/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!resEvent.ok) { if (resEvent.status === 404) throw new Error("Evento não encontrado."); if (resEvent.status === 401) throw new Error("Não autenticado."); throw new Error(`Erro evento (${resEvent.status})`); }
            eventData = await resEvent.json() as Evento;
            setEvento({ ...eventData, isOwner: eventData.isOwner || false });
            setPresencaConfirmada(eventData.presencaConfirmada || false);

            const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, { headers: { Authorization: `Bearer ${token}` } });
            if (!resUser.ok) { console.error("Erro user fetch:", resUser.status); setFetchError("Aviso: Dados do utilizador não carregados."); setIsAuthorizedForStats(false); }
            else {
                 const userData: LoggedInUser = await resUser.json();
                 setCurrentUser(userData);
                 const authorized = userData.role === 1 || userData.role === 2 || (eventData && userData.id === eventData.created_by);
                 setIsAuthorizedForStats(authorized);
                 if(fetchError?.startsWith("Aviso:")) setFetchError(null);
            }
        } catch (error: any) { console.error("Erro useEffect:", error); setFetchError(error.message || "Erro a carregar."); setEvento(null); setIsAuthorizedForStats(false); }
        finally { setIsLoadingEvent(false); }
    };
    if (id) { fetchEventoAndUser(); } else { setFetchError("ID inválido."); setIsLoadingEvent(false); }
  }, [id]);


  const togglePresenca = async () => {
    if (!evento) return;
    setIsLoadingPresence(true); setStatusMessage(null);
    const token = getAuthToken(); if (!token) { setIsLoadingPresence(false); return; }
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/answerEvent/${evento.id}`, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json", Authorization: `Bearer ${token}` } });
        const responseData = await res.json(); if (!res.ok) throw new Error(responseData.message || `Erro (${res.status})`);
        const novoEstado = !presencaConfirmada; setPresencaConfirmada(novoEstado);
        setEvento(prev => prev ? ({ ...prev, confirmedParticipants: novoEstado ? prev.confirmedParticipants + 1 : Math.max(0, prev.confirmedParticipants - 1) }) : null);
        setStatusMessage({ type: "success", message: responseData.message || (novoEstado ? "Presença confirmada!" : "Confirmação cancelada.") });
    } catch (error: any) { console.error("Erro togglePresenca:", error); setStatusMessage({ type: "error", message: error.message || "Erro" }); }
    finally { setIsLoadingPresence(false); }
  }

  const handleEditEvent = () => { if (!evento) return; router.push(`/forum/${evento.id}/editar`); }

  const generateQrCode = () => { if (!evento) return; const url = `${window.location.origin}/confirmar-presenca/${evento.id}`; setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`); setShowQrCode(true); }

  const getTipoBadgeClass = (tipo: number) => { switch (tipo) { case 1: return "bg-blue-100 text-blue-800 hover:bg-blue-100"; case 2: return "bg-red-100 text-red-800 hover:bg-red-100"; case 3: return "bg-green-100 text-green-800 hover:bg-green-100"; default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"; } }

  if (isLoadingEvent) { return ( <div className="p-6"> <div className="flex items-center gap-4"> <Button variant="outline" size="icon"> <ArrowLeft className="h-4 w-4" /> </Button> <h1>A carregar...</h1> </div> </div> ); }
  if (fetchError && !evento) { return ( <div className="p-6 space-y-4"> <div className="flex items-center gap-4"> <Button variant="outline" size="icon"> <ArrowLeft className="h-4 w-4" /> </Button> <h1>Erro</h1> </div> <p>{fetchError}</p> </div> ); }
  if (!evento) { return ( <div className="p-6 space-y-4"> <div className="flex items-center gap-4"> <Button variant="outline" size="icon"> <ArrowLeft className="h-4 w-4" /> </Button> <h1>Erro</h1> </div> <p>Evento não carregado.</p> </div> ); }

  const dataEvento = new Date(evento.event_date);
  const prazoInscricao = new Date(evento.deadline_date);
  const isPending = evento.state === 2; 
  const isRejected = evento.state === 3; 
  const podeConfirmarPresenca = evento.event_type_id !== 2 && new Date() < prazoInscricao && evento.state === 1;
  const inscricaoEncerrada = evento.event_type_id !== 2 && new Date() >= prazoInscricao;
  const isAlerta = evento.event_type_id === 2;

  return (
    <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button variant="outline" size="icon" aria-label="Voltar" onClick={() => router.push("/forum")}> <ArrowLeft className="h-4 w-4" /> </Button>
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                <h1 className="text-2xl md:text-3xl font-bold">{evento.title}</h1>
                <Badge className={cn("shrink-0", getTipoBadgeClass(evento.event_type_id))} variant="outline">{evento.event_type.name}</Badge>
            </div>
            {isPending && <Badge variant="secondary" className="order-3 sm:order-none">Pendente</Badge>}
            {isRejected && <Badge variant="destructive" className="order-3 sm:order-none">Rejeitado</Badge>}
            <div className="flex w-full sm:w-auto items-center gap-2 justify-end order-last sm:ml-auto">
                {evento.isOwner && ( <> <Button variant="outline" size="sm" onClick={handleEditEvent} title="Editar"> <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Editar</span> </Button> <Button variant="outline" size="sm" onClick={generateQrCode} title="Gerar QR"> <QrCode className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Gerar QR</span> </Button> </> )}
                {isAuthorizedForStats && !isPending && !isAlerta && (
                     <Button variant="outline" size="sm" asChild title="Ver Estatísticas">
                         <Link href={`/forum/${evento.id}/estatisticas`}> <BarChartHorizontalBig className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Estatísticas</span> </Link>
                     </Button>
                 )}
            </div>
        </div>

      {fetchError && fetchError.startsWith("Aviso:") && ( <div className="p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm" role="alert"> {fetchError} </div> )}
      {statusMessage && ( <div className={cn("p-4 rounded-md", statusMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")} role="alert"> {statusMessage.message} </div> )}

      <Card>
        <CardHeader> <CardTitle>Detalhes do Evento</CardTitle> </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2"> <Calendar className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-sm font-medium">Data</p> <p>{isValidDate(dataEvento) ? format(dataEvento, "Pp", { locale: pt }) : "Inválida"}</p> </div> </div>
            <div className="flex items-center gap-2"> <MapPin className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-sm font-medium">Localização</p> <p>{evento.location}</p> </div> </div>
            {!isAlerta && ( <div className="flex items-center gap-2"> <Users className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-sm font-medium">Participantes</p> <p> {evento.confirmedParticipants}/{evento.maximum_qty ?? 'N/A'} {evento.maximum_qty && evento.confirmedParticipants < evento.maximum_qty && evento.state === 1 && (<span className="text-xs text-green-600">(Vagas)</span>)} {evento.maximum_qty && evento.confirmedParticipants >= evento.maximum_qty && evento.state === 1 && (<span className="text-xs text-orange-600">(Lotado)</span>)} </p> </div> </div> )}
          </div>
          <Separator />
          <div> <h3 className="mb-2 font-medium">Descrição</h3> <p className="whitespace-pre-line text-sm">{evento.description || "N/D"}</p> </div>
          {!isAlerta && (
            <>
              <Separator />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div> <p className="text-sm font-medium">Prazo Inscrição</p> <p className="text-sm">{isValidDate(prazoInscricao) ? format(prazoInscricao, "Pp", { locale: pt }) : "Inválido"}</p> </div>
                <div className="flex justify-end">
                    {podeConfirmarPresenca && ( <Button onClick={togglePresenca} disabled={isLoadingPresence} variant={presencaConfirmada ? "outline" : "default"} className={cn("min-w-[180px]", presencaConfirmada && "border-green-500 text-green-600 hover:bg-green-50")}> {isLoadingPresence ? "Processando..." : presencaConfirmada ? (<><Check className="mr-2 h-4 w-4"/>Confirmada</>) : ("Confirmar Presença")} </Button> )}
                    {presencaConfirmada && !podeConfirmarPresenca && !inscricaoEncerrada && (<Badge variant="outline" className="border-green-500 text-green-600"><Check className="mr-2 h-4 w-4"/>Confirmada</Badge> )}
                    {inscricaoEncerrada && !isRejected && (<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Prazo encerrado</Badge> )}
                    {isPending && (<Badge variant="secondary">Pendente</Badge> )}
                    {isRejected && (<Badge variant="destructive">Rejeitado</Badge> )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showQrCode} onOpenChange={setShowQrCode}> <DialogContent className="sm:max-w-md"> <DialogHeader> <DialogTitle>QR Code</DialogTitle> </DialogHeader> <div className="flex flex-col items-center p-6"> {qrCodeUrl ? ( <> <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 mb-4" /> <p className="text-sm text-center text-muted-foreground">Partilhe para registo de presença.</p> <Button className="mt-4" onClick={() => { const a=document.createElement("a"); a.href=qrCodeUrl; a.download=`qr-${evento.id}.png`; a.click(); }}>Baixar</Button> </> ) : ( <p>A gerar...</p> )} </div> </DialogContent> </Dialog>
    </div>
  )
}