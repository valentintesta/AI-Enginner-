import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewInterview from './pages/NewInterview'
import Interview from './pages/Interview'
import Feedback from './pages/Feedback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new" element={<NewInterview />} />
      <Route path="/interview/:sessionId" element={<Interview />} />
      <Route path="/feedback/:sessionId" element={<Feedback />} />
    </Routes>
  )
}
