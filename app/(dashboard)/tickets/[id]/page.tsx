import { Suspense } from "react"
import TicketDetail from "./ticket-detail"

// Este é um componente de servidor (Server Component)
export default function TicketPage({ params }: { params: { id: string } }) {
  // Aqui podemos acessar params.id diretamente porque estamos em um Server Component
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <TicketDetail id={params.id} />
    </Suspense>
  )
}

