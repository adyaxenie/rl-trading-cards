import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'RL Trading Cards',
  description: 'Rocket League Pro Player Trading Cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-metal-900 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}