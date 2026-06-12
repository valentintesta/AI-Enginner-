import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const isInterview = location.pathname.startsWith('/interview/')

  if (isInterview) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-dark-1/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="font-semibold text-white">VoiceHire</span>
        </Link>
        <Link
          to="/new"
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors"
        >
          Start Interview
        </Link>
      </div>
    </nav>
  )
}
