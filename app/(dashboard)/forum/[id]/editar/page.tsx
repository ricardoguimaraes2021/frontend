"use client";

import type React from "react";
import { useState, useEffect, ChangeEvent, FormEvent } from "react"; 
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toaster, toast } from "sonner"; 

interface EventType {
  id: string | number; 
  name: string;
}

interface FormData {
  nome: string;
  data: Date | undefined; 
  horaEvento: string;
  capacidadeMaxima: string;
  prazoInscricao: Date | undefined; 
  horaPrazo: string;
  localizacao: string;
  tipo: EventType | null;
  descricao: string;
}

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(?:^|; *)authToken=([^;]*)/);
    return match ? match[1] : null;
  }
  return null;
};

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; 

  const [formData, setFormData] = useState<FormData>({
    nome: "",
    data: undefined, 
    horaEvento: "",
    capacidadeMaxima: "",
    prazoInscricao: undefined, 
    horaPrazo: "",
    localizacao: "",
    tipo: null,
    descricao: "",
  });

  const [tiposDeEvento, setTiposDeEvento] = useState<EventType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [errors, setErrors] = useState<Record<string, string[]>>({}); 

  useEffect(() => {
    const fetchDados = async () => {
      setIsLoading(true); 
      const token = getAuthToken();
      if (!token) {
        toast.error("Erro de Autenticação", { description: "Por favor, faça login novamente." });
        router.push('/login');
        return;
      }
      if (!id) {
        toast.error("Erro", { description: "ID do evento não encontrado." });
        router.push('/forum'); 
        return;
      }

      let fetchedTipos: EventType[] = [];

      try {
        const tiposRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/type`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (!tiposRes.ok) {
            let errorMsg = `Erro ${tiposRes.status} ao buscar tipos: ${tiposRes.statusText}`;
             try { const errData = await tiposRes.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
             throw new Error(errorMsg);
        }
        const tiposData = await tiposRes.json();
         if (!Array.isArray(tiposData)) {
            console.error("API response for event types is not an array:", tiposData);
            throw new Error("Formato inesperado dos tipos de evento recebidos.");
         }
        fetchedTipos = tiposData;
        setTiposDeEvento(fetchedTipos);

        const eventoRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/evento/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
             'Accept': 'application/json',
          },
        });
         if (!eventoRes.ok) {
             let errorMsg = `Erro ${eventoRes.status} ao buscar evento: ${eventoRes.statusText}`;
             try { const errData = await eventoRes.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
             throw new Error(errorMsg);
         }
        const evento = await eventoRes.json();

        if (!evento || typeof evento !== 'object' || !evento.title) {
             throw new Error("Dados do evento inválidos ou incompletos recebidos.");
        }

        const eventDate = new Date(evento.event_date);
        const deadlineDate = new Date(evento.deadline_date);

        setFormData({
          nome: evento.title || "",
          data: !isNaN(eventDate.getTime()) ? eventDate : undefined,
          horaEvento: !isNaN(eventDate.getTime()) ? eventDate.toTimeString().slice(0, 5) : "",
          capacidadeMaxima: evento.maximum_qty?.toString() ?? "", 
          prazoInscricao: !isNaN(deadlineDate.getTime()) ? deadlineDate : undefined,
          horaPrazo: !isNaN(deadlineDate.getTime()) ? deadlineDate.toTimeString().slice(0, 5) : "",
          localizacao: evento.location || "",
          tipo: fetchedTipos.find((tipo: EventType) => tipo.id === evento.event_type_id) || null,
          descricao: evento.description || "",
        });

      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao Carregar Dados", { description: error.message || "Não foi possível carregar os dados para edição." });
      } finally {
        setIsLoading(false); 
      }
    };

    fetchDados();
  }, [id, router]); 

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const errorKey = name === 'nome' ? 'title'
                   : name === 'localizacao' ? 'location'
                   : name === 'descricao' ? 'description'
                   : name === 'capacidadeMaxima' ? 'maximum_qty'
                   : name === 'horaEvento' ? 'event_date' 
                   : name === 'horaPrazo' ? 'deadline_date' 
                   : ''; 

    if (errorKey && errors[errorKey]) {
      setErrors(prev => {
        const { [errorKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    const selectedTipo = tiposDeEvento.find(tipo => tipo.id.toString() === value);
    const isNowAlerta = selectedTipo?.name?.toLowerCase() === 'alerta';

    setFormData(prev => ({
        ...prev,
        tipo: selectedTipo || null,
        capacidadeMaxima: isNowAlerta ? '' : prev.capacidadeMaxima,
        prazoInscricao: isNowAlerta ? undefined : prev.prazoInscricao,
        horaPrazo: isNowAlerta ? '' : prev.horaPrazo,
    }));

     const errorKeyType = 'event_type_id';
     const errorKeyCapacity = 'maximum_qty';
     const errorKeyDeadline = 'deadline_date';
     if (errors[errorKeyType] || errors[errorKeyCapacity] || (isNowAlerta && errors[errorKeyDeadline])) {
        setErrors(prev => {
            const { [errorKeyType]: _, [errorKeyCapacity]: __, ...rest } = prev;
            if (isNowAlerta && rest[errorKeyDeadline]) {
                 const { [errorKeyDeadline]: ___, ...restWithoutDeadline } = rest;
                 return restWithoutDeadline;
            }
            return rest;
         });
     }
  };

  const handleDateChange = (name: "data" | "prazoInscricao", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date }));

    const errorKey = name === 'data' ? 'event_date' : 'deadline_date';
    if (errors[errorKey]) {
      setErrors(prev => {
        const { [errorKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const isAlerta = formData.tipo?.name?.toLowerCase() === "alerta";

  const handleSubmit = async (e: FormEvent) => {
       e.preventDefault();
       setIsSubmitting(true);
       setErrors({});
        let validationPassed = true;
       const newErrors: Record<string, string[]> = {};
    
        if (!formData.tipo) {
          newErrors.event_type_id = ["Selecione um tipo de evento."];
          validationPassed = false;
        }
        if (!formData.nome.trim()) {
          newErrors.title = ["O nome do evento é obrigatório."];
          validationPassed = false;
        }
        if (!formData.data || !formData.horaEvento) {
          newErrors.event_date = ["Data e Hora do evento são obrigatórios."];
          validationPassed = false;
        }
        if (!isAlerta && (!formData.prazoInscricao || !formData.horaPrazo)) {
          newErrors.deadline_date = ["Data e Hora limite de inscrição são obrigatórios para este tipo de evento."];
          validationPassed = false;
        }
        if (!formData.localizacao.trim()) {
          newErrors.location = ["A localização é obrigatória."];
          validationPassed = false;
        }
        if (!formData.descricao.trim()) {
          newErrors.description = ["A descrição é obrigatória."];
          validationPassed = false;
        }
        if (formData.tipo && !isAlerta) {
          const capacity = parseInt(formData.capacidadeMaxima, 10);
          if (isNaN(capacity) || capacity <= 0) {
            newErrors.maximum_qty = ["Capacidade máxima deve ser um número positivo."];
            validationPassed = false;
          }
        }
    
        let dataEventoCompleta: Date | null = null;
        let dataPrazoCompleta: Date | null = null;
    
        if (formData.data && formData.horaEvento) {
          try {
            dataEventoCompleta = new Date(`${format(formData.data, "yyyy-MM-dd")}T${formData.horaEvento}:00`);
            if (isNaN(dataEventoCompleta.getTime())) throw new Error("Invalid Date object");
          } catch {
            newErrors.event_date = [...(newErrors.event_date || []), "Formato de data ou hora inválido."].filter((v, i, a) => a.indexOf(v) === i);
            validationPassed = false;
          }
        }
    
        if (!isAlerta && formData.prazoInscricao && formData.horaPrazo) {
          try {
            dataPrazoCompleta = new Date(`${format(formData.prazoInscricao, "yyyy-MM-dd")}T${formData.horaPrazo}:00`);
            if (isNaN(dataPrazoCompleta.getTime())) throw new Error("Invalid Date object");
          } catch {
            newErrors.deadline_date = [...(newErrors.deadline_date || []), "Formato de data ou hora inválido."].filter((v, i, a) => a.indexOf(v) === i);
            validationPassed = false;
          }
        }
    
        const now = new Date(); 
    
        if (dataEventoCompleta) { 
            if (dataEventoCompleta <= now) { 
                newErrors.event_date = [...(newErrors.event_date || []), "A data e hora do evento devem ser no futuro."].filter((v, i, a) => a.indexOf(v) === i);
                validationPassed = false;
            }
        }
    
        if (!isAlerta && dataEventoCompleta && dataPrazoCompleta) { 
            if (dataPrazoCompleta <= now) { 
                newErrors.deadline_date = [...(newErrors.deadline_date || []), "A data e hora limite de inscrição devem ser no futuro."].filter((v, i, a) => a.indexOf(v) === i);
                validationPassed = false;
            }
            if (dataPrazoCompleta > dataEventoCompleta) {
                newErrors.deadline_date = [...(newErrors.deadline_date || []), "A data limite não pode ser posterior à data do evento."].filter((v, i, a) => a.indexOf(v) === i);
                validationPassed = false;
            }
        }
    
        if (!validationPassed) {
          setErrors(newErrors);
          toast.error("Erro de Validação", { description: "Por favor, corrija os erros no formulário." });
          setIsSubmitting(false);
          return; 
        }
    
        const payload: any = {
          event_type_id: formData.tipo!.id,
          title: formData.nome.trim(),
          description: formData.descricao.trim(),
          location: formData.localizacao.trim(),
          event_date: dataEventoCompleta!.toISOString(),
        };
    
        if (!isAlerta) {
          payload.maximum_qty = parseInt(formData.capacidadeMaxima, 10);
          payload.deadline_date = dataPrazoCompleta!.toISOString();
        }
    
        const token = getAuthToken();
        if (!token) {
          toast.error("Erro de Autenticação", { description: "Sessão inválida. Faça login novamente." });
          setIsSubmitting(false);
          router.push('/login');
          return;
        }
    
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/eventos/editar/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
    
          const responseData = await response.json();
    
          if (!response.ok) {
            if (response.status === 422 && responseData.errors) {
              const backendErrors: Record<string, string[]> = {};
              for (const key in responseData.errors) {
                const frontendKey = key;
                backendErrors[frontendKey] = responseData.errors[key];
              }
              setErrors(backendErrors);
              toast.error("Erro de Validação do Servidor", { description: "Verifique os campos indicados." });
            } else {
              const errorMessage = responseData.message || responseData.error || `Erro ${response.status} ao contactar o servidor.`;
              toast.error("Erro ao Editar Evento", { description: errorMessage });
            }
            console.error("Server responded with error:", responseData);
          } else {
            console.log("Evento editado com sucesso (resposta API):", responseData);
            toast.success("Sucesso!", { description: responseData.message || "Evento atualizado com sucesso." });
            router.push("/forum");
          }
    
        } catch (error: any) {
          console.error("Falha na comunicação com a API:", error);
          toast.error("Erro de Rede", { description: error.message || "Não foi possível conectar ao servidor." });
        } finally {
          setIsSubmitting(false);
        }
      };

  if (isLoading) {
     return (
         <div className="flex justify-center items-center h-64">
             <p>A carregar dados do evento...</p>
         </div>
     );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-6"> 
      <Toaster richColors closeButton position="top-right" /> 

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Editar Evento</h1>
        <p className="text-muted-foreground">Altere os detalhes para editar o evento existente.</p>
      </div>

      <Separator />

      <Card className="overflow-hidden border shadow-sm"> 
         <CardHeader className="bg-muted/30 px-6 py-4"> 
          <CardTitle className="text-lg font-medium">Detalhes do Evento</CardTitle>
        </CardHeader>

         <form onSubmit={handleSubmit} noValidate> 
          <CardContent className="p-6 space-y-6">
             <div className="grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2"> 

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="nome">Nome do Evento</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "nome-error" : undefined}
                  className={cn(errors.title && "border-red-500")} 
                />
                {errors.title && <p id="nome-error" className="text-sm text-red-600 mt-1">{errors.title[0]}</p>}
              </div>

              <div className="space-y-2 md:col-span-1">
                 <Label htmlFor="tipo">Tipo de Evento</Label>
                 <Select
                     value={formData.tipo?.id?.toString() || ""} 
                     onValueChange={handleSelectChange}
                     required
                     aria-invalid={!!errors.event_type_id}
                     aria-describedby={errors.event_type_id ? "tipo-error" : undefined}
                 >
                    <SelectTrigger id="tipo" className={cn(errors.event_type_id && "border-red-500")}>
                         <SelectValue placeholder="Selecione o tipo de evento" />
                     </SelectTrigger>
                     <SelectContent>
                         {tiposDeEvento.length === 0 ? (
                             <SelectItem value="loading" disabled>A carregar tipos...</SelectItem>
                         ) : (
                             tiposDeEvento.map((tipo) => (
                                 <SelectItem key={tipo.id.toString()} value={tipo.id.toString()}>
                                     {tipo.name}
                                 </SelectItem>
                             ))
                         )}
                     </SelectContent>
                 </Select>
                 {errors.event_type_id && <p id="tipo-error" className="text-sm text-red-600 mt-1">{errors.event_type_id[0]}</p>}
              </div>

               <div className="space-y-2 md:col-span-1">
                   <Label>Data e Hora do Evento</Label>
                   <Popover>
                       <PopoverTrigger asChild>
                           <Button
                               variant={"outline"}
                               className={cn(
                                   "w-full justify-start text-left font-normal",
                                   !formData.data && "text-muted-foreground",
                                   errors.event_date && "border-red-500" // Highlight border on error
                               )}
                               aria-invalid={!!errors.event_date}
                               aria-describedby={errors.event_date ? "event-date-error" : undefined}
                           >
                               <CalendarIcon className="mr-2 h-4 w-4" />
                               {formData.data ? format(formData.data, "PPP", { locale: pt }) : <span>Selecione uma data</span>}
                           </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0">
                           <Calendar
                               mode="single"
                               selected={formData.data}
                               onSelect={(date) => handleDateChange("data", date as Date | undefined)}
                               disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                               initialFocus
                           />
                       </PopoverContent>
                   </Popover>
                   <Input
                       id="horaEvento"
                       name="horaEvento"
                       type="time"
                       value={formData.horaEvento}
                       onChange={handleInputChange}
                       required
                       className={cn("mt-1", errors.event_date && "border-red-500")}
                       aria-invalid={!!errors.event_date}
                       aria-describedby={errors.event_date ? "event-date-error" : undefined}
                   />
                   {errors.event_date && <p id="event-date-error" className="text-sm text-red-600 mt-1">{errors.event_date.join(' ')}</p>}
               </div>

               {!isAlerta && (
                   <div className="space-y-2 md:col-span-1">
                       <Label>Data e Hora Limite de Inscrição</Label>
                       <Popover>
                           <PopoverTrigger asChild>
                               <Button
                                   variant={"outline"}
                                   className={cn(
                                       "w-full justify-start text-left font-normal",
                                       !formData.prazoInscricao && "text-muted-foreground",
                                       errors.deadline_date && "border-red-500"
                                   )}
                                   aria-invalid={!!errors.deadline_date}
                                   aria-describedby={errors.deadline_date ? "deadline-date-error" : undefined}
                               >
                                   <CalendarIcon className="mr-2 h-4 w-4" />
                                   {formData.prazoInscricao ? format(formData.prazoInscricao, "PPP", { locale: pt }) : <span>Selecione uma data</span>}
                               </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0">
                               <Calendar
                                   mode="single"
                                   selected={formData.prazoInscricao}
                                   onSelect={(date) => handleDateChange("prazoInscricao", date as Date | undefined)}
                                   disabled={(date) =>
                                       date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                       (!!formData.data && !!date && date > formData.data)
                                   }
                                   initialFocus
                               />
                           </PopoverContent>
                       </Popover>
                       <Input
                           id="horaPrazo"
                           name="horaPrazo"
                           type="time"
                           value={formData.horaPrazo}
                           onChange={handleInputChange}
                           required={!isAlerta}
                           className={cn("mt-1", errors.deadline_date && "border-red-500")}
                           aria-invalid={!!errors.deadline_date}
                           aria-describedby={errors.deadline_date ? "deadline-date-error" : undefined}
                       />
                       {errors.deadline_date && <p id="deadline-date-error" className="text-sm text-red-600 mt-1">{errors.deadline_date.join(' ')}</p>}
                   </div>
               )}

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  aria-invalid={!!errors.location}
                  aria-describedby={errors.location ? "location-error" : undefined}
                  className={cn(errors.location && "border-red-500")}
                />
                {errors.location && <p id="location-error" className="text-sm text-red-600 mt-1">{errors.location[0]}</p>}
              </div>

              {!isAlerta && (
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="capacidadeMaxima">Capacidade Máxima</Label>
                  <Input
                    id="capacidadeMaxima"
                    name="capacidadeMaxima"
                    type="number"
                    min="1"
                    value={formData.capacidadeMaxima}
                    onChange={handleInputChange}
                    required={!isAlerta}
                    aria-invalid={!!errors.maximum_qty}
                    aria-describedby={errors.maximum_qty ? "capacity-error" : undefined}
                    className={cn(errors.maximum_qty && "border-red-500")}
                  />
                  {errors.maximum_qty && <p id="capacity-error" className="text-sm text-red-600 mt-1">{errors.maximum_qty[0]}</p>}
                </div>
              )}

              <div className="space-y-2 md:col-span-2"> 
                <Label htmlFor="descricao">Descrição do Evento</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={5}
                  required
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? "description-error" : undefined}
                  className={cn(errors.description && "border-red-500")}
                />
                {errors.description && <p id="description-error" className="text-sm text-red-600 mt-1">{errors.description[0]}</p>}
              </div>

            </div> 
          </CardContent>

           <CardFooter className="flex justify-end gap-4 border-t bg-muted/10 px-6 py-4"> 
            <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/forum")}
                disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}> 
              {isSubmitting ? "A editar..." : "Guardar Alterações"} 
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}