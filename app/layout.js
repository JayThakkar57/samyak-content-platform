import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Samyak Computer Classes — Surat',
  description: 'Premium content delivery platform by Samyak Computer Classes, Surat — Skilling India since 2013',
  icons: {
    icon: '/samyak-logo.png',
    apple: '/samyak-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
