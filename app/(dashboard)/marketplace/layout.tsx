import type React from "react"
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <MarketplaceNav />
      {children}
    </div>
  )
}

