import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const API = 'http://localhost:8000'

const JOB_ROLES = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
  'Marketing Manager', 'Sales Representative', 'HR Specialist', 'DevOps Engineer',
  'AI/ML Engineer', 'Business Analyst', 'Other',
]

export default function NewInterview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    candidate_name: '',
    company_name: '',
    job_role: '',
    interview_duration_minutes: 15,
  })
  const [error, setError] = useState('')

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async e => {
    e.preventDefault()
    if (!form.candidate_name || !form.company_name || !form.job_role) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(`${API}/api/interview`, {
        ...form,
        interview_duration_minutes: Number(form.interview_duration_minutes),
      })
      navigate(`/interview/${data.session_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create interview. Make sure the backend is running.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-1">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <Link to="/" className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">New Interview</h1>
          <p className="text-slate-400 text-sm">Configure the screening session before starting.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="p-6 rounded-2xl bg-dark-2 border border-white/10 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Candidate Name</label>
              <input
                name="candidate_name"
                value={form.candidate_name}
                onChange={onChange}
                placeholder="e.g. Maria Lopez"
                className="w-full px-4 py-3 rounded-xl bg-dark-3 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={onChange}
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-3 rounded-xl bg-dark-3 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Role</label>
              <select
                name="job_role"
                value={form.job_role}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl bg-dark-3 border border-white/10 text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
              >
                <option value="" disabled>Select a role...</option>
                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration: <span className="text-primary-light">{form.interview_duration_minutes} minutes</span>
              </label>
              <input
                type="range"
                name="interview_duration_minutes"
                min={5}
                max={30}
                step={5}
                value={form.interview_duration_minutes}
                onChange={onChange}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>5 min</span>
                <span>30 min</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up session...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Interview
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
