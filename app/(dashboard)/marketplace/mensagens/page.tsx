// app/(dashboard)/marketplace/mensagens/page.tsx
import { MensagensClient } from "./MensagensClient"
import { Suspense } from "react"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MensagensPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <Suspense fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-muted-foreground">A carregar mensagens...</p>
        </div>
      }>
        <MensagensClient />
      </Suspense>
    </div>
  )
}