import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import NavbarWrapper from '@/components/NavbarWrapper'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RL.TCG | Rocket League Trading Card Game',
  description: 'Collect Rocket League pro player cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={inter.className}>
        <AuthProvider>
          {/* Navbar will appear on all pages */}
          <NavbarWrapper />
          
          {/* Main content */}
          <main>
            {children}
          </main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}