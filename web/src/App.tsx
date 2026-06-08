import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CameraScreen } from './screens/CameraScreen'
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
          <Route path="/results" element={<ResultsScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
