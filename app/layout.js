import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Samyak — Content Platform',
  description: 'Premium content delivery platform for Samyak programs',
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
