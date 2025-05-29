import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader.jsx'
import AudioRecorder from './pages/AudioRecorder.jsx'
import RandomNum from './pages/RandomNum.jsx'
import TranscriptionPage from './pages/TranscriptionPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RandomNum />} />
        <Route path="/loader" element={<Loader />} />
        <Route path="/transcription" element={<TranscriptionPage />} />
        <Route path="/record" element={<AudioRecorder />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App