import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Samyak — Skilling India',
  description: 'Premium content delivery platform for Samyak IT Solutions',
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
