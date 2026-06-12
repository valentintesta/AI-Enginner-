import { useNavigate } from 'react-router-dom'

const RECOMMENDATION_COLORS = {
  STRONG_HIRE: 'text-emerald-400 bg-emerald-400/10',
  HIRE: 'text-green-400 bg-green-400/10',
  MAYBE: 'text-yellow-400 bg-yellow-400/10',
  NO_HIRE: 'text-red-400 bg-red-400/10',
}

export default function InterviewCard({ session }) {
  const navigate = useNavigate()
  const rec = session.summary?.recommendation

  return (
    <div
      onClick={() =>
        session.has_feedback
          ? navigate(`/feedback/${session.session_id}`)
          : navigate(`/interview/${session.session_id}`)
      }
      className="cursor-pointer group p-5 rounded-2xl border border-white/10 bg-dark-2 hover:border-primary/50 hover:bg-dark-3 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white group-hover:text-primary-light transition-colors">
            {session.job_role}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">{session.company_name}</p>
        </div>
        <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${session.ended ? 'bg-slate-700 text-slate-300' : 'bg-primary/20 text-primary-light'}`}>
          {session.ended ? 'Completed' : 'In Progress'}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
          {session.candidate_name?.charAt(0)?.toUpperCase()}
        </div>
        <span>{session.candidate_name}</span>
      </div>

      {rec && (
        <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${RECOMMENDATION_COLORS[rec] || 'text-slate-400 bg-slate-700'}`}>
          {rec.replace('_', ' ')}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 flex items-center justify-between">
        <span>{session.has_feedback ? 'View feedback' : 'Continue interview'}</span>
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
