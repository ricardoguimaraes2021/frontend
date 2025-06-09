"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  name: string;
  email: string;
  house_number: string;
  dob: string; 
  nif: string;
  role: string;
}

interface Role {
  id: number;
  name: string;
}

interface House {
  id: number;
  number: string;
}

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/);
  return match ? match[2] : null;
};

const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error parsing date string: ${dateString}`, error);
    return "";
  }
};


export default function EditarUtilizadorPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    house_number: "",
    dob: "",
    nif: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [houses, setHouses] = useState<House[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errorRoles, setErrorRoles] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser(userId: string) {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/${userId}/getUserById`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Erro ao carregar os dados do utilizador.";
          setError(errorMessage);
          toast.error(errorMessage, { duration: 5000 });
          return;
        }

        const data = await response.json();
        if (data.userRole > 2) {
          router.push("/dashboard")
        }

        if (!data || !data.user) {
           const errorMessage = "Dados do utilizador não encontrados na resposta da API.";
           setError(errorMessage);
           toast.error(errorMessage, { duration: 5000 });
           return;
        }

        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          house_number: data.user.house_number || "",
          dob: formatDateForInput(data.user.dob), 
          nif: data.user.nif?.toString() || "",
          role: data.user.role?.toString() || "",
        });

      } catch (err) {
        const errorMessage = "Falha ao carregar os dados do utilizador.";
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } finally {
        setLoading(false);
      }
    }

    async function fetchRoles() {
      setLoadingRoles(true);
      setErrorRoles(null);
      try {
        const token = getAuthToken();
        if (!token) {
           router.push("/login");
           return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getRoles`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Erro ao carregar os roles.";
          setErrorRoles(errorMessage);
          toast.error(errorMessage, { duration: 5000 });
          return;
        }

        const data = await response.json();
        if (data && data.roles) {
          setRoles(data.roles);
        } else {
          setErrorRoles("Resposta dos roles inválida.");
          toast.error("Resposta dos roles inválida.", { duration: 5000 });
        }

      } catch (err) {
        const errorMessage = "Falha ao carregar os roles.";
        setErrorRoles(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } finally {
        setLoadingRoles(false);
      }
    }

    async function fetchHouses() {
      const token = getAuthToken()
      if (!token) {
        console.error("Token de autenticação não encontrado.")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/getHousesNumber`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        setHouses(data.houseNumbers || [])
      } catch (error) {
        console.error("Erro ao carregar números de casa:", error)
        setHouses([])
      }
    }

    if (id) {
      const userId = Array.isArray(id) ? id[0] : id;
      fetchUser(userId);
    }
    fetchRoles();
    fetchHouses()
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("Token não encontrado, redirecionando para o login...");
        router.push("/login");
        return;
      }

      const userId = Array.isArray(id) ? id[0] : id;
      if (!userId) {
        toast.error("ID do utilizador não encontrado.", { duration: 5000 });
        return;
      }

      const dataPayload = new FormData();

      dataPayload.append('name', formData.name);
      dataPayload.append('email', formData.email);
      dataPayload.append('house_number', formData.house_number || ''); 
      dataPayload.append('dob', formData.dob); 
      dataPayload.append('nif', formData.nif || ''); 
      dataPayload.append('role', formData.role); 


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/${userId}/edit`, {
        method: "POST", 
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: dataPayload, 
      });

      if (!response.ok) {
        let errorMessage = "Erro ao atualizar utilizador.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
             console.error("Could not parse error response as JSON:", parseError);
             errorMessage = `${response.status} ${response.statusText}` || errorMessage;
        }
        console.error("Erro ao atualizar utilizador:", errorMessage);
        toast.error(errorMessage, { duration: 5000 });
        return;
      }

      toast.success("Utilizador atualizado com sucesso!", {
        description: "As informações foram atualizadas com sucesso.",
        duration: 5000,
      });
      router.push("/utilizadores"); 

    } catch (error) {
      console.error("Erro de rede ou exceção ao atualizar utilizador:", error);
      toast.error("Falha ao comunicar com o servidor.", { duration: 5000 });
    }
  };

  const handleCancel = () => {
    router.push("/utilizadores");
  };

  if (loading || loadingRoles) {
    return <div>Carregando dados...</div>;
  }

  if (error || errorRoles) {
    return <div>Erro ao carregar dados: {error || errorRoles}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Editar Utilizador</h1>
          <p className="text-muted-foreground">Atualize as informações do utilizador.</p>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="bg-secondary/50 px-6">
          <CardTitle className="text-lg font-medium">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Data de Nascimento</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob} 
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
              <Label htmlFor="house_number">Nº Casa</Label>
              <Select 
                name="house_number" 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, house_number: value }))
                }} 
                value={formData.house_number}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar Nº Casa">
                    {formData.house_number ?  formData.house_number : "Selecionar Nº Casa"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem 
                      key={house.id} 
                      value={house.number.toString()} // Garante que é string
                    >
                      {house.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))} value={formData.role}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t bg-secondary/20 px-6 py-4">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button form="edit-form" type="submit">
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}