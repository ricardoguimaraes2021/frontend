"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Edit, ShieldCheck, Camera } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserData {
  id: number;
  name: string;
  dob: string; // Keep as string from API
  email: string;
  nif: string | null;
  house_number: string | null;
  image: string | null;
}

const getAuthToken = () => {
  const match = document.cookie.match(/(^| )authToken=([^;]+)/);
  return match ? match[2] : null;
};

// --- Helper Function to Format Date ONLY for Input ---
// Takes API date string (e.g., ISO format) and returns YYYY-MM-DD or ""
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const dateObj = new Date(dateString);
    // Check if the date is valid before formatting
    if (isNaN(dateObj.getTime())) {
        // Don't log warnings here if the initial API value might be invalid sometimes
        // console.warn(`Invalid date string received: ${dateString}`);
        return ""; // Return empty string for invalid dates
    }
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error parsing date string: ${dateString}`, error);
    return ""; // Return empty string on error
  }
};
// --- End Helper Function ---

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // editFormData.dob will now store the YYYY-MM-DD format for the input
  const [editFormData, setEditFormData] = useState<Partial<Omit<UserData, 'dob'> & { dob?: string }>>({});
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          console.warn("Token não encontrado, redirecionando para o login...");
          router.push("/login");
          return;
        }

        // Fetch user data (using env variable as in original code)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Erro ao carregar os dados do perfil.";
          setError(errorMessage);
          toast.error(errorMessage, { duration: 5000 });
          return;
        }

        const data: UserData = await response.json();
        setUserData(data); // Store original data exactly as received

        // --- Prepare initial form data, formatting the date ---
        setEditFormData({
          name: data.name,
          // Format date from API for the input field
          dob: formatDateForInput(data.dob),
          email: data.email,
          nif: data.nif,
          house_number: data.house_number,
          // Don't put image data in editFormData
        });
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        const errorMessage = "Falha ao carregar os dados do perfil.";
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  // handleLogout remains the same
  const handleLogout = () => {
    document.cookie = `authToken=; path=/; Secure`;
    router.push("/login");
  };

  // handleInputChange remains the same
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value, // Stores dob directly as YYYY-MM-DD from input
    }));
  };

  // handlePasswordInputChange remains the same
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // handlePasswordSubmit remains the same
  const handlePasswordSubmit = async () => {
    setPasswordError(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("As novas palavras-passe não coincidem.")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova palavra-passe deve ter pelo menos 6 caracteres.")
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword,
          new_password_confirmation: passwordForm.confirmPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setPasswordError(errorData.message || "Erro ao alterar a palavra-passe.")
        return
      }

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordModalOpen(false)
      toast.success("Palavra-passe alterada com sucesso!", {
        duration: 5000,
      })
    } catch (error) {
      console.error("Erro ao alterar palavra-passe:", error)
      setPasswordError("Ocorreu um erro ao processar o seu pedido.")
    }
  }

  // handleImageChange remains the same
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // handleClickUpload remains the same
  const handleClickUpload = (): void => {
    fileInputRef.current?.click();
  };

  // --- Updated handleSave ---
  const handleSave = async (): Promise<void> => {
    if (!userData) return;

    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("Token não encontrado, redirecionando para o login...");
        router.push("/login");
        return;
      }

      const formDataPayload = new FormData();

      // Append fields from editFormData.
      // The backend uses 'sometimes', so it's okay to send even unchanged fields.
      // If you want to optimize and only send changed fields, you'd compare
      // editFormData values against the original userData values before appending.
      if (editFormData.name !== undefined) formDataPayload.append('name', editFormData.name);
      if (editFormData.email !== undefined) formDataPayload.append('email', editFormData.email);
      // The dob in editFormData is already YYYY-MM-DD from the input
      if (editFormData.dob !== undefined) formDataPayload.append('dob', editFormData.dob);
      if (editFormData.nif !== undefined) formDataPayload.append('nif', editFormData.nif || ''); // Handle null by sending empty string
      if (editFormData.house_number !== undefined) formDataPayload.append('house_number', editFormData.house_number || ''); // Handle null

      // Append image only if a new one was selected
      if (selectedImage) {
        formDataPayload.append('image', selectedImage);
      }

      // --- Use the exact POST endpoint from your original code ---
      const response = await fetch(
        // Using the hardcoded URL as per your original handleSave
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/utilizadores/${userData.id}/edit`,
        {
          method: "POST", // Correct method
          headers: {
            // Content-Type is set automatically for FormData
            Authorization: `Bearer ${token}`,
          },
          body: formDataPayload, // Send FormData
        }
      );

      if (!response.ok) {
        let errorMessage = "Erro ao guardar as alterações.";
        try {
          // Basic error parsing from original code
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
            console.error("Could not parse error response:", e);
        }
        toast.error(errorMessage, {
          duration: 5000,
        });
        return;
      }

      // Process successful response
      const updatedUserDataResponse = await response.json();
      const updatedUser: UserData = updatedUserDataResponse.user; // Get updated user

      // --- Update local state ---
      setUserData(updatedUser); // Update main user data with response from backend

      // --- Reset edit form data using the *new* data, formatting the date ---
      setEditFormData({
        name: updatedUser.name || "",
        // Format the date *received* from the backend for the *next* edit session
        dob: formatDateForInput(updatedUser.dob),
        email: updatedUser.email || "",
        nif: updatedUser.nif || "",
        house_number: updatedUser.house_number || "",
      });

      setIsEditing(false);
      setSelectedImage(null); // Clear selected image
      setImagePreview(null); // Clear preview
      toast.success("Perfil atualizado!", {
        description: "As suas informações foram atualizadas com sucesso.",
        duration: 5000,
      });

    } catch (error) {
      console.error("Erro ao guardar perfil:", error);
      toast.error("Não foi possível guardar as alterações.", {
        duration: 5000,
      });
    }
  };
  // --- End Updated handleSave ---

  // --- Updated handleCancel ---
  const handleCancel = (): void => {
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
    if (userData) {
        // Reset edit form data back to original userData values, formatting the date
        setEditFormData({
          name: userData.name || "",
          // Format original date again for the input field
          dob: formatDateForInput(userData.dob),
          email: userData.email || "",
          nif: userData.nif || "",
          house_number: userData.house_number || "",
        });
    }
  };
  // --- End Updated handleCancel ---

  // --- Updated getImageUrl ---
  const getImageUrl = (): string => {
    if (imagePreview) return imagePreview;
    // Construct URL assuming images are served relative to the API's public storage
    // Using localhost:8000 as per the handleSave fetch URL
    if (userData?.image != null) return `http://192.168.1.86:8000/storage/${userData.image}`;
    return "/placeholder.svg"; // Default placeholder
  };
  // --- End Updated getImageUrl ---

  // --- Loading/Error/No Data States (Original Structure) ---
  if (loading) {
    return <div>Carregando as informações do perfil...</div>;
  }

  if (error) {
    return <div>Erro ao carregar o perfil: {error}</div>;
  }

  if (!userData) {
    return <div>Não foi possível carregar os dados do utilizador.</div>;
  }
  // --- End Loading/Error/No Data States ---

  // --- JSX Structure (Original) ---
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground">Gerencie as suas informações pessoais.</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          )}
          {/* Original password button logic */}
          <Button variant="outline" onClick={() => setPasswordModalOpen(true)} className="hidden sm:flex">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Alterar Palavra-Passe
          </Button>
        </div>
      </div>

      <Separator />

      {/* Original Card Structure */}
      <Card className="overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-secondary/50 px-6">
          <CardTitle className="text-lg font-medium">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Original Image Column */}
            <div className="flex flex-col items-center justify-start pt-4 md:pt-0 md:justify-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={getImageUrl()} alt="Foto de perfil" />
                  <AvatarFallback className="bg-secondary text-primary">
                    {userData.name
                      ?.split(" ")
                      .slice(0, 2)
                      .map((namePart) => namePart.charAt(0).toUpperCase())
                      .join("") || "N/A"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <Button
                      onClick={handleClickUpload}
                      size="sm"
                      className="rounded-full h-8 w-8 p-0"
                      aria-label="Alterar foto"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
              {isEditing && selectedImage && (
                <p className="text-sm text-muted-foreground text-center">
                  Nova imagem: {selectedImage.name}
                </p>
              )}
            </div>

            {/* Original Info Column */}
            <div className="space-y-4">
              {isEditing ? (
                <>
                  {/* Edit Fields */}
                   <div className="space-y-2">
                     <Label htmlFor="name">Nome</Label>
                     <Input
                       id="name"
                       name="name"
                       value={editFormData.name || ""}
                       onChange={handleInputChange}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="dob">Data de Nascimento</Label>
                     <Input
                       id="dob"
                       name="dob"
                       type="date"
                       // --- Value uses the formatted date from state ---
                       value={editFormData.dob || ""}
                       onChange={handleInputChange}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       name="email"
                       type="email"
                       value={editFormData.email || ""}
                       onChange={handleInputChange}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="nif">NIF</Label>
                     <Input
                       id="nif"
                       name="nif"
                       value={editFormData.nif || ""}
                       onChange={handleInputChange}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="house_number">Nº Casa</Label>
                     <Input
                       id="house_number"
                       name="house_number"
                       value={editFormData.house_number || ""}
                       onChange={handleInputChange}
                     />
                   </div>
                </>
              ) : (
                <>
                  {/* Display Fields */}
                   <div className="grid gap-2">
                     <label className="text-sm font-medium text-muted-foreground">
                       Nome
                     </label>
                     <div className="text-lg font-medium">{userData.name}</div>
                   </div>

                   <div className="grid gap-2">
                     <label className="text-sm font-medium text-muted-foreground">
                       Data de Nascimento
                     </label>
                     <div className="text-lg">
                        {/* Display formatted date or placeholder using original userData */}
                       {userData.dob ? new Date(userData.dob).toLocaleDateString("pt-PT") : "Não definida"}
                     </div>
                   </div>

                   <div className="grid gap-2">
                     <label className="text-sm font-medium text-muted-foreground">
                       Email
                     </label>
                     <div className="text-lg">{userData.email}</div>
                   </div>

                   <div className="grid gap-2">
                     <label className="text-sm font-medium text-muted-foreground">
                       NIF
                     </label>
                     <div className="text-lg">{userData.nif || "Não definido"}</div>
                   </div>

                   <div className="grid gap-2">
                     <label className="text-sm font-medium text-muted-foreground">
                       Nº Casa
                     </label>
                     <div className="text-lg">
                       {userData.house_number || "Não definido"}
                     </div>
                   </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
        {/* Original Footer */}
        {isEditing && (
          <CardFooter className="flex justify-end gap-4 border-t bg-secondary/20 px-6 py-4">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Original Password Dialog */}
       <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Palavra-Passe</DialogTitle>
            <DialogDescription>Introduza a sua palavra-passe atual e a nova palavra-passe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {passwordError && (
               // Original error display
              <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{passwordError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="oldPassword">Palavra-Passe Atual</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova Palavra-Passe</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Palavra-Passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordSubmit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}