import type React from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { TopNav } from "@/components/layout/top-nav"
import { SidebarProvider } from "@/contexts/sidebar-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-secondary/20">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <TopNav />
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

