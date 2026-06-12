import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import InterviewCard from '../components/InterviewCard'

const API = 'http://localhost:8000'

export default function Home() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/interviews`)
      .then(r => setInterviews(r.data))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-dark-1">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            AI-Powered Voice Interviews
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Your AI Interview<br />
            <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
              Screening Platform
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Conduct professional voice interviews powered by OpenAI's Realtime API. Real-time speech-to-speech with instant, structured candidate assessments.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Interview
          </Link>
        </div>

        {/* Stack badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {['OpenAI Realtime', 'gpt-realtime-2', 'WebRTC', 'GPT-4o Scoring', 'FastAPI', 'React'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-dark-3 border border-white/10 text-slate-400 text-xs">
              {t}
            </span>
          ))}
        </div>

        {/* Past interviews */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Past Interviews</h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-dark-2 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-white/10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No interviews yet.</p>
              <Link to="/new" className="mt-3 inline-block text-primary-light text-sm hover:underline">
                Start your first interview
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviews.map(s => (
                <InterviewCard key={s.session_id} session={s} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
