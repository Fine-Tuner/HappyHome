import { ThemeProvider } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AnnouncementDetailPage from './pages/AnnouncementDetailPage'
import { Suspense } from 'react'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="/" element={<Suspense fallback={<div>Loading...</div>}><AnnouncementsPage /></Suspense>} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
