import './globals.css'
import SessionKeeper from './components/SessionKeeper'

export const metadata = {
  title: 'Sayme',
  description: '자기성찰 챌린지',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <SessionKeeper />
        {children}
      </body>
    </html>
  )
}