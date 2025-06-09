import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "ViziHub - A Sua Vizinhança, Mais Conectada",
  description:
    "Plataforma digital inovadora que promove a comunicação, colaboração e segurança dentro de comunidades residenciais.",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
          }}
        />
      </body>
    </html>
  )
}