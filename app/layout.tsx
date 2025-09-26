import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { Manrope } from "next/font/google"
import "./globals.css"
import Providers from "./providers"
import { ToastHost } from "@/components/ui/ToastHost"
import ConditionalLayout from "./ConditionalLayout"

const geist = GeistSans.variable
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })

export const metadata: Metadata = {
  title: "Marina Pharmacy TMS",
  description: "Task Management System for Marina Pharmacy",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist} ${manrope.variable} antialiased`}>
      <body className="font-sans">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
          <ToastHost />
        </Providers>
      </body>
    </html>
  )
}
