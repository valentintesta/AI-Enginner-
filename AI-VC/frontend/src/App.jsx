import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

const API_URL = 'http://localhost:8000'

function ScoreCard({ label, value, sub, subColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-700 uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className="text-4xl font-900 text-slate-900">{value ?? 'N/A'}</p>
      {sub && (
        <p className={`text-sm font-600 mt-2 ${subColor || 'text-slate-500'}`}>{sub}</p>
      )}
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-800 text-slate-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

function Expandable({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 bg-white hover:bg-slate-50 transition text-left"
      >
        <span className="font-700 text-slate-800">{title}</span>
        <span className="text-slate-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  )
}

function tryParseJson(text) {
  if (!text) return null
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

function getVerdict(memo) {
  if (!memo) return null
  const up = memo.toUpperCase()
  if (up.includes('[INVEST]') || up.includes('[STRONG YES]')) return { label: 'INVEST', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
  if (up.includes('[PASS]')) return { label: 'PASS', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  if (up.includes('[DIG DEEPER]') || up.includes('[MAYBE')) return { label: 'DIG DEEPER', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  return { label: 'VERDICT', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' }
}

export default function App() {
  const [tab, setTab] = useState('quick')
  const [companyName, setCompanyName] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [pitchText, setPitchText] = useState('')
  const [fullUrl, setFullUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = tab === 'quick'
        ? { company_name: companyName, company_url: companyUrl, pitch_text: '' }
        : { company_name: '', company_url: fullUrl, pitch_text: pitchText }
      const res = await axios.post(`${API_URL}/analyze`, payload, { timeout: 300000 })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const marketData = result ? tryParseJson(result.market_analysis) : null
  const productData = result ? tryParseJson(result.product_analysis) : null
  const tractionData = result ? tryParseJson(result.traction_analysis) : null
  const verdict = result ? getVerdict(result.final_memo) : null

  const downloadReport = () => {
    if (!result) return
    const text = `DEALSCOUT ANALYSIS REPORT\n${'='.repeat(60)}\n\nPITCH:\n${result.pitch_text}\n\nMARKET:\n${result.market_analysis}\n\nPRODUCT:\n${result.product_analysis}\n\nTRACTION:\n${result.traction_analysis}\n\nDEBATE:\n${result.debate_transcript}\n\nQUESTIONS:\n${result.questions_to_reconsider}\n\nVERDICT:\n${result.final_memo}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'dealscout_report.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-3xl font-900 text-slate-900 tracking-tight">DealScout VC Terminal</h1>
        <p className="text-slate-500 font-500 mt-1">Multi-Agent Deal Analysis Platform</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Input Section */}
        <Section title="Deal Input" subtitle="Enter company details — works with just name + URL or full pitch deck">
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab('quick')}
              className={`px-5 py-2 rounded-lg font-600 text-sm transition ${tab === 'quick' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Quick Mode (Name + URL)
            </button>
            <button
              onClick={() => setTab('full')}
              className={`px-5 py-2 rounded-lg font-600 text-sm transition ${tab === 'full' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Full Pitch Deck
            </button>
          </div>

          {tab === 'quick' ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-600 text-slate-700 mb-1 block">Company Name</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="e.g. Anthropic"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-600 text-slate-700 mb-1 block">Company Website</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="https://anthropic.com"
                  value={companyUrl}
                  onChange={e => setCompanyUrl(e.target.value)}
                />
              </div>
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                Quick Mode: AI researches the company and auto-generates a pitch deck before analysis.
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-sm font-600 text-slate-700 mb-1 block">Pitch Deck Text</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white h-40 resize-none"
                  placeholder="Paste the full pitch deck text here..."
                  value={pitchText}
                  onChange={e => setPitchText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-600 text-slate-700 mb-1 block">Company Website (optional)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="https://..."
                  value={fullUrl}
                  onChange={e => setFullUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-700 py-3 rounded-xl transition text-sm"
          >
            {loading ? 'Running analysis...' : 'Run Analysis'}
          </button>
        </Section>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mb-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-700 text-slate-800">Running 7-agent analysis pipeline...</p>
            <p className="text-slate-500 text-sm mt-1">Research → Market → Product → Traction → Debate → Questions → Verdict</p>
            <p className="text-slate-400 text-xs mt-2">This may take 1–3 minutes</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-10 text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <hr className="border-slate-200 mb-10" />

            {/* Dashboard */}
            <Section title="Analysis Dashboard" subtitle="Key metrics at a glance">
              <div className="grid grid-cols-3 gap-4">
                <ScoreCard
                  label="Market Timing"
                  value={marketData?.market_timing_score ? `${marketData.market_timing_score}/10` : 'N/A'}
                  sub={marketData?.tam_estimate ? `TAM: ${marketData.tam_estimate}` : null}
                />
                <ScoreCard
                  label="Product-Market Fit"
                  value={productData?.product_market_fit || 'N/A'}
                  sub={productData?.is_feature_or_platform ? `Type: ${productData.is_feature_or_platform}` : null}
                />
                <ScoreCard
                  label="Traction Score"
                  value={tractionData?.traction_score ? `${tractionData.traction_score}/10` : 'N/A'}
                  sub={tractionData?.red_flags?.length > 0 ? `${tractionData.red_flags.length} red flags` : 'No red flags'}
                  subColor={tractionData?.red_flags?.length > 0 ? 'text-red-500' : 'text-emerald-600'}
                />
              </div>
            </Section>

            {/* Agent Debate */}
            <Section title="Agent Debate" subtitle="Discussion between Market, Product, and Traction analysts">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                {result.debate_transcript
                  ? result.debate_transcript.split('\n').filter(l => l.trim()).map((line, i) => {
                      const isMarket = line.toLowerCase().startsWith('market agent')
                      const isProduct = line.toLowerCase().startsWith('product agent')
                      const isTraction = line.toLowerCase().startsWith('traction agent')
                      const isSystem = line.startsWith('TOPIC:') || line.startsWith('CONSENSUS:') || line.toLowerCase().startsWith('turn')
                      if (isSystem) return <p key={i} className="text-xs font-700 uppercase text-slate-400 py-1">{line}</p>
                      return (
                        <div key={i} className={`rounded-xl px-4 py-3 text-sm ${isMarket ? 'bg-blue-50 border border-blue-100' : isProduct ? 'bg-purple-50 border border-purple-100' : isTraction ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
                          {line}
                        </div>
                      )
                    })
                  : <p className="text-slate-400 text-sm">No debate transcript available.</p>
                }
              </div>
            </Section>

            {/* Auto-generated pitch (quick mode) */}
            {result.raw_input?.length < 200 && result.pitch_text && (
              <Section title="Auto-Generated Pitch" subtitle={`Research agent built this from web sources for ${result.company_name}`}>
                <Expandable title="View Generated Pitch">
                  <pre className="text-xs leading-relaxed">{result.pitch_text}</pre>
                </Expandable>
              </Section>
            )}

            {/* Deep Dives */}
            <Section title="Deep Dives" subtitle="Detailed reports from each agent">
              <Expandable title="Market Analysis">
                {marketData
                  ? <pre className="text-xs">{JSON.stringify(marketData, null, 2)}</pre>
                  : <span>{result.market_analysis}</span>
                }
              </Expandable>
              <Expandable title="Product Analysis">
                {productData
                  ? <pre className="text-xs">{JSON.stringify(productData, null, 2)}</pre>
                  : <span>{result.product_analysis}</span>
                }
              </Expandable>
              <Expandable title="Traction Analysis">
                {tractionData
                  ? <pre className="text-xs">{JSON.stringify(tractionData, null, 2)}</pre>
                  : <span>{result.traction_analysis}</span>
                }
              </Expandable>
            </Section>

            {/* Questions */}
            <Section title="Questions to Reconsider" subtitle="Critical questions before investing">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-slate-800 leading-relaxed">
                <ReactMarkdown>{result.questions_to_reconsider || 'No questions generated.'}</ReactMarkdown>
              </div>
            </Section>

            {/* Verdict */}
            <Section title="Investment Verdict" subtitle="Final recommendation from the General Partner">
              <div className={`border rounded-2xl p-8 ${verdict?.bg}`}>
                <p className={`text-2xl font-900 mb-4 ${verdict?.color}`}>{verdict?.label}</p>
                <div className="text-sm text-slate-800 leading-relaxed">
                  <ReactMarkdown>{result.final_memo}</ReactMarkdown>
                </div>
              </div>
            </Section>

            {/* Download */}
            <div className="flex justify-center">
              <button
                onClick={downloadReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-700 px-8 py-3 rounded-xl transition text-sm"
              >
                Download Full Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
