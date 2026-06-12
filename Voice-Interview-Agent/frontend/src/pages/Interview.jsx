import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime'

const API = 'http://localhost:8000'

function extractText(item) {
  if (!item || !Array.isArray(item.content)) return ''
  return item.content
    .map(c => c.transcript || c.text || '')
    .join(' ')
    .trim()
}

function historyToMessages(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter(i => i.type === 'message' && (i.role === 'user' || i.role === 'assistant'))
    .map(i => ({ role: i.role, content: extractText(i) }))
    .filter(m => m.content)
}

function WaveAnimation() {
  return (
    <div className="flex items-center gap-1 h-6">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="wave-bar w-1 bg-primary-light rounded-full"
          style={{ height: '24px', animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

function Avatar({ label, initial, isActive, isSpeaking }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring scale-125" />
            <div className="absolute inset-0 rounded-full bg-primary/10 pulse-ring scale-150" style={{ animationDelay: '0.3s' }} />
          </>
        )}
        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 transition-colors duration-300 ${isActive ? 'border-primary bg-primary/20 text-primary-light' : 'border-white/10 bg-dark-3 text-slate-400'}`}>
          {initial}
        </div>
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent border-2 border-dark-1" />
        )}
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>{label}</p>
        {isSpeaking && (
          <div className="mt-1 flex justify-center">
            <WaveAnimation />
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Interview() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const sessionRef = useRef(null)
  const historyRef = useRef([])
  const endedRef = useRef(false)
  const transcriptRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('Connecting...')
  const [connected, setConnected] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [ended, setEnded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  const endInterview = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    setEnded(true)
    setStatus('Generating feedback...')
    try { sessionRef.current?.close() } catch { /* noop */ }

    const finalMessages = historyToMessages(historyRef.current)
    try {
      await axios.post(`${API}/api/interview/${sessionId}/feedback`, { transcript: finalMessages })
    } catch { /* feedback endpoint still navigates */ }
    navigate(`/feedback/${sessionId}`)
  }, [sessionId, navigate])

  useEffect(() => {
    let cancelled = false
    let localSession = null

    async function start() {
      try {
        setStatus('Setting up session...')
        const { data } = await axios.get(`${API}/api/interview/${sessionId}/token`)

        const agent = new RealtimeAgent({
          name: 'Alex',
          instructions: data.instructions,
        })

        localSession = new RealtimeSession(agent, { model: data.model })
        sessionRef.current = localSession

        localSession.on('history_updated', (history) => {
          historyRef.current = history
          setMessages(historyToMessages(history))
        })

        localSession.on('transport_event', (event) => {
          const t = event?.type || ''
          if (t === 'input_audio_buffer.speech_started') {
            setUserSpeaking(true)
          } else if (
            t === 'input_audio_buffer.speech_stopped' ||
            t === 'input_audio_buffer.committed'
          ) {
            setUserSpeaking(false)
          } else if (t.includes('audio') && t.includes('delta')) {
            setAiSpeaking(true)
          } else if (
            t === 'response.output_audio.done' ||
            t === 'response.audio.done' ||
            t === 'response.done'
          ) {
            setAiSpeaking(false)
          }
        })

        localSession.on('error', (e) => {
          const msg = e?.error?.message || e?.message || 'connection error'
          setStatus(`Error: ${msg}`)
        })

        setStatus('Requesting microphone access...')
        await localSession.connect({ apiKey: data.value })
        if (cancelled) {
          try { localSession.close() } catch { /* noop */ }
          return
        }

        setConnected(true)
        setStatus('Connected — just speak naturally, Alex is listening.')
        if (data.duration_minutes) setTimeLeft(data.duration_minutes * 60)
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message || 'unknown error'
        setStatus(`Failed to connect: ${detail}`)
      }
    }

    start()
    return () => {
      cancelled = true
      try { sessionRef.current?.close() } catch { /* noop */ }
    }
  }, [sessionId])

  // Countdown timer — auto-ends when it reaches zero.
  useEffect(() => {
    if (timeLeft === null || ended) return
    if (timeLeft <= 0) {
      endInterview()
      return
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, ended, endInterview])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="min-h-screen bg-dark-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-dark-2/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="text-sm text-slate-400">{status}</span>
        </div>
        <div className="flex items-center gap-4">
          {timeLeft !== null && !ended && (
            <span className={`text-sm font-mono ${timeLeft <= 60 ? 'text-red-400' : 'text-slate-400'}`}>
              {formatTime(timeLeft)}
            </span>
          )}
          {!ended && (
            <button
              onClick={endInterview}
              className="px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
            >
              End Interview
            </button>
          )}
        </div>
      </div>

      {/* Avatars */}
      <div className="flex items-center justify-center gap-16 py-10 border-b border-white/5">
        <Avatar label="Alex — AI Interviewer" initial="A" isActive={aiSpeaking} isSpeaking={aiSpeaking} />
        <div className="text-slate-700 text-xs">live</div>
        <Avatar label="You" initial="Y" isActive={userSpeaking} isSpeaking={userSpeaking} />
      </div>

      {/* Transcript */}
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && !ended && (
          <p className="text-center text-slate-600 text-sm pt-8">
            {connected ? 'Alex will greet you shortly — start talking when you hear them.' : 'Connecting to the interviewer...'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                A
              </div>
            )}
            <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-dark-3 text-slate-200 rounded-tl-sm' : 'bg-primary/20 text-primary-light rounded-tr-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {ended && (
          <div className="text-center text-slate-500 text-sm pt-4">
            Interview ended — generating your feedback...
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!ended && (
        <div className="border-t border-white/10 px-6 py-5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <svg className="w-4 h-4 text-primary-light" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            Voice is live — turn-taking is automatic, just talk like a normal call.
          </div>
        </div>
      )}
    </div>
  )
}
