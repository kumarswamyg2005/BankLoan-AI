import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import TrainPage from './pages/TrainPage'
import PredictPage from './pages/PredictPage'
import ResultPage from './pages/ResultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReviewQueuePage from './pages/ReviewQueuePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/upload"     element={<UploadPage />} />
            <Route path="/train"      element={<TrainPage />} />
            <Route path="/predict"    element={<PredictPage />} />
            <Route path="/result"     element={<ResultPage />} />
            <Route path="/analytics"  element={<AnalyticsPage />} />
            <Route path="/review"     element={<ReviewQueuePage />} />
            <Route path="*"           element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
