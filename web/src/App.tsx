import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CameraScreen } from './screens/CameraScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { LandingScreen } from './screens/LandingScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { UploadScreen } from './screens/UploadScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/camera" element={<CameraScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          {/* `/results` is the hand-off a just-finished analysis lands on; it
              immediately persists and replaces itself with `/results/:id`,
              which is the canonical, refreshable, linkable address (P2). */}
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/results/:sessionId" element={<ResultsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
