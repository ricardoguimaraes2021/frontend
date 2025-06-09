// app/(auth)/definir-password/page.tsx
import { DefinirPasswordForm } from "./DefinirPasswordForm"

export const dynamic = 'force-dynamic' // Desativa renderização estática
export const revalidate = 0 // Garante comportamento dinâmico

export default function DefinirPasswordPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <DefinirPasswordForm />
    </div>
  )
}