import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const API = 'http://localhost:8000'

const SCORE_LABELS = {
  communication: 'Communication Skills',
  technical_knowledge: 'Technical Knowledge',
  problem_solving: 'Problem Solving',
  cultural_fit: 'Cultural Fit',
  confidence: 'Confidence & Presence',
}

const REC_CONFIG = {
  STRONG_HIRE: { label: 'Strong Hire', color: 'from-emerald-500 to-green-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  HIRE: { label: 'Hire', color: 'from-green-500 to-teal-400', text: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  MAYBE: { label: 'Maybe', color: 'from-yellow-500 to-amber-400', text: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  NO_HIRE: { label: 'No Hire', color: 'from-red-500 to-rose-400', text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
}

function ScoreBar({ label, score }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-white">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-dark-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function Feedback() {
  const { sessionId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/interview/${sessionId}/feedback`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Session not found.</p>
        <Link to="/" className="text-primary-light hover:underline text-sm">Go home</Link>
      </div>
    )
  }

  const summary = data.summary
  const rec = summary?.recommendation
  const recCfg = REC_CONFIG[rec] || { label: rec, color: 'from-slate-500 to-slate-400', text: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' }

  return (
    <div className="min-h-screen bg-dark-1">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to="/" className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-2xl font-bold text-white">{data.candidate_name}</h1>
            <p className="text-slate-400 text-sm mt-1">{data.job_role} · {data.company_name}</p>
          </div>
        </div>

        {!summary ? (
          <div className="p-8 rounded-2xl bg-dark-2 border border-white/10 text-center">
            <p className="text-slate-400">No feedback generated yet. The interview may still be in progress.</p>
            <Link to={`/interview/${sessionId}`} className="mt-4 inline-block text-primary-light text-sm hover:underline">
              Return to interview
            </Link>
          </div>
        ) : (
          <>
            {/* Overall + recommendation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-dark-2 border border-white/10 flex flex-col items-center justify-center">
                <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Overall Score</p>
                <div className={`text-5xl font-bold bg-gradient-to-r ${recCfg.color} bg-clip-text text-transparent`}>
                  {summary.overall_score}
                </div>
                <p className="text-slate-500 text-xs mt-1">out of 100</p>
              </div>
              <div className="p-6 rounded-2xl bg-dark-2 border border-white/10 flex flex-col items-center justify-center gap-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Recommendation</p>
                <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${recCfg.bg} ${recCfg.text}`}>
                  {recCfg.label}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="p-6 rounded-2xl bg-dark-2 border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">Category Scores</h2>
              {Object.entries(SCORE_LABELS).map(([key, label]) => (
                <ScoreBar key={key} label={label} score={summary.scores?.[key] ?? 0} />
              ))}
            </div>

            {/* Strengths & improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-dark-2 border border-white/10">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {(summary.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">·</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-dark-2 border border-white/10">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {(summary.areas_for_improvement || []).map((a, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-amber-500 flex-shrink-0">·</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Overall impression */}
            {summary.overall_impression && (
              <div className="p-5 rounded-2xl bg-dark-2 border border-white/10">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Overall Impression</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{summary.overall_impression}</p>
              </div>
            )}

            {/* Transcript toggle */}
            {data.messages?.length > 0 && (
              <div className="rounded-2xl bg-dark-2 border border-white/10 overflow-hidden">
                <button
                  onClick={() => setShowTranscript(v => !v)}
                  className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <span>Interview Transcript</span>
                  <svg className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTranscript && (
                  <div className="px-5 pb-5 space-y-3 border-t border-white/5">
                    {data.messages.map((m, i) => (
                      <div key={i} className={`text-sm ${m.role === 'assistant' ? 'text-slate-300' : 'text-primary-light'}`}>
                        <span className="font-medium">{m.role === 'assistant' ? 'Alex: ' : 'Candidate: '}</span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
