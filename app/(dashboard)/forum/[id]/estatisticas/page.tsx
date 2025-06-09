"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Users, UserCheck, List, Percent, Check as CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type UserInfo = {
  id: number
  name: string
  email: string
}

type EventStatistics = {
  confirmedCount: number
  attendedCount: number
  confirmedUsers: UserInfo[]
  attendedUsers: UserInfo[]
  event: {
      id: number
      title: string
      created_by: number 
  }
}

type LoggedInUser = {
    id: number
    name: string
    email: string
    role: number 
}

type ProcessedUserInfo = {
    id: number;
    name: string;
    email: string;
    confirmed: boolean; 
    present: boolean;   
}

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(^| )authToken=([^;]+)/)
    return match ? match[2] : null
  }
  return null
}

export default function EventoEstatisticas() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string;

  const [stats, setStats] = useState<EventStatistics | null>(null) 
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null); 
  const [isLoading, setIsLoading] = useState(true) 
  const [error, setError] = useState<string | null>(null) 
  const [isAuthorized, setIsAuthorized] = useState(false); 

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
          setError("ID do evento não encontrado na URL.");
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      setError(null);
      setIsAuthorized(false);
      setStats(null); 

      const token = getAuthToken();
      if (!token) {
        setError("Token de autenticação não encontrado. Faça login novamente.");
        setIsLoading(false);
        return;
      }

      let fetchedUserData: LoggedInUser | null = null; 

      try {
        try {
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!userRes.ok) {
                console.error(`Erro ao buscar dados do utilizador: ${userRes.status}`);
                if (userRes.status === 401) {
                     setError("Sessão expirada ou inválida. Por favor, faça login novamente.");
                     setIsLoading(false); return; 
                 }
                 setError("Aviso: Não foi possível carregar os dados do utilizador.");
            } else {
                fetchedUserData = await userRes.json();
                setCurrentUser(fetchedUserData);
                if(error?.startsWith("Aviso:")) setError(null);
            }
        } catch (userFetchError: any) {
             console.error("Falha na rede ou erro ao buscar utilizador:", userFetchError);
             setError("Aviso: Falha ao conectar para buscar dados do utilizador.");
        }

        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/evento/${id}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!statsRes.ok) {
             let errorMsg = "Erro ao carregar estatísticas do evento.";
             try {
                 const errData = await statsRes.json();
                 if (errData.message) errorMsg = errData.message;
             } catch (e) {}
             errorMsg += ` (Código: ${statsRes.status})`; 

             if (!error?.includes("Sessão expirada")) {
                  setError(errorMsg); 
             }
             setIsLoading(false);
             setStats(null);
             setIsAuthorized(false);
             return;
        }
        const statsData: EventStatistics = await statsRes.json();

        let authorized = false;
         if (fetchedUserData) {
            authorized =
               fetchedUserData.role === 1 || 
               fetchedUserData.role === 2 || 
               fetchedUserData.id === statsData.event.created_by; 
         } else {
             authorized = true;
             console.warn("Dados do utilizador não carregados, UI baseado na autorização do backend.");
         }

        if (!authorized) {
             setError("Não tem permissão para ver estas estatísticas.");
             setIsAuthorized(false);
             setStats(null); 
        } else {
             setIsAuthorized(true);
             setStats(statsData);
             if(error?.startsWith("Aviso:")) setError(null);
        }

      } catch (err: any) {
        console.error("Erro inesperado no fetchData:", err);
        if (!error) {
             setError(err.message || "Ocorreu um erro inesperado.");
        }
        setStats(null);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }; 
    fetchData(); 
  }, []);


  const attendancePercentage: number | null = useMemo(() => {
      if (!stats || !stats.confirmedCount) {
          return null;
      }
      return (stats.attendedCount / stats.confirmedCount) * 100;
  }, [stats]); 


  const processedUsers: ProcessedUserInfo[] = useMemo(() => {
    if (!stats) return []; 

    const userMap = new Map<number, ProcessedUserInfo>();

    const confirmedUserIds = new Set(stats.confirmedUsers.map(u => u.id));
    const attendedUserIds = new Set(stats.attendedUsers.map(u => u.id));

    const allUsers = [...stats.confirmedUsers, ...stats.attendedUsers];
    const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values());

    uniqueUsers.forEach(user => {
         userMap.set(user.id, {
             ...user, 
             confirmed: confirmedUserIds.has(user.id), 
             present: attendedUserIds.has(user.id)      
         });
     });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  }, [stats]); 



  if (isLoading) {
    return (
        <div className="p-6 flex justify-center items-center">
            <p>A carregar estatísticas...</p> {}
        </div>
    );
  }

  if (error && !stats) {
     return (
      <div className="space-y-6 p-6">
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" aria-label="Voltar" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-red-600">Erro ao Carregar</h1>
         </div>
          <p className="text-red-700">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
       </div>
     );
  }

  if (!isAuthorized || !stats) {
       return (
         <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
               <Button variant="outline" size="icon" aria-label="Voltar" onClick={() => router.back()}>
                   <ArrowLeft className="h-4 w-4" />
                </Button>
               <h1 className="text-xl font-bold text-red-600">Acesso Negado</h1>
            </div>
             <p className="text-red-700">Não tem permissão para aceder a esta página ou os dados não estão disponíveis.</p>
          </div>
       );
  }

  return (
    <div className="space-y-6 p-6">
       {error && error.startsWith("Aviso:") && (
           <div className="p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm mb-4" role="alert">
             {error}
           </div>
       )}

      <div className="flex flex-wrap items-center gap-4"> 
        <Button variant="outline" size="icon" aria-label="Voltar ao Evento" onClick={() => router.push(`/forum/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold mr-auto">
            Estatísticas: {stats.event.title}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3"> 
         <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Confirmações</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">{stats.confirmedCount}</div>
                 <p className="text-xs text-muted-foreground">Utilizadores que confirmaram</p>
             </CardContent>
         </Card>
         <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Compareceram</CardTitle>
                 <UserCheck className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">{stats.attendedCount}</div>
                 <p className="text-xs text-muted-foreground">Utilizadores presentes (QR)</p>
             </CardContent>
         </Card>
         <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                 <Percent className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 {attendancePercentage !== null ? (
                     <>
                         <div className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</div>
                         <p className="text-xs text-muted-foreground">Dos confirmados, quantos compareceram</p>
                     </>
                 ) : (
                     <>
                         <div className="text-2xl font-bold">N/A</div>
                         <p className="text-xs text-muted-foreground">{stats.confirmedCount === 0 ? "Nenhuma confirmação" : "Erro no cálculo"}</p>
                     </>
                 )}
             </CardContent>
         </Card>
      </div>

      <Separator />

       <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" /> Lista de Participantes ({processedUsers.length})
             </CardTitle>
             <p className="text-sm text-muted-foreground">
                 Lista de todos os utilizadores que confirmaram ou compareceram ao evento.
             </p>
          </CardHeader>
          <CardContent>
             {processedUsers.length > 0 ? (
                 <Table>
                     <TableHeader>
                         <TableRow>
                             <TableHead>Nome</TableHead>
                             <TableHead>Email</TableHead>
                             <TableHead className="text-center w-[100px]">Confirmou?</TableHead>
                             <TableHead className="text-center w-[100px]">Compareceu?</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                        {processedUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-center">
                                    {user.confirmed ? (
                                        <CheckIcon
                                            className="h-5 w-5 text-green-600 mx-auto"
                                            aria-label="Confirmado"
                                        />
                                    ) : null}
                                </TableCell>
                                <TableCell className="text-center">
                                    {user.present ? (
                                        <CheckIcon
                                            className="h-5 w-5 text-blue-600 mx-auto"
                                            aria-label="Presente"
                                        />
                                    ) : null}
                                 </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
             ) : (
                 <p className="text-muted-foreground text-center py-4">
                     Nenhum participante registado (confirmado ou presente) para este evento.
                 </p>
              )}
          </CardContent>
       </Card>
    </div>
  )
}