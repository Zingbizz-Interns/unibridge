import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import CompareBar from '@/components/compare/CompareBar'
import { CompareProvider } from '@/components/compare/CompareProvider'
import './globals.css'

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'UniBridge',
  description: 'College discovery and admission platform for India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased bg-md-surface text-md-on-surface transition-colors duration-300 relative overflow-x-hidden min-h-screen">
        <CompareProvider>
          {children}
          <CompareBar />
        </CompareProvider>
      </body>
    </html>
  )
}
