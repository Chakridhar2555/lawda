import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { ClientLayout } from "@/components/client-layout"

// Initialize the Inter font with strict typing
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

// Define metadata with strict typing
export const metadata: Metadata = {
  title: "Get Home Realty",
  description: "Real Estate Management System",
  icons: {
    icon: "/favicon.ico",
  },
} as const;

// Root layout component with strict typing
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Suspense>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
} 