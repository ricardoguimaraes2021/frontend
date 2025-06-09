import type React from "react"
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/20 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  )
}

