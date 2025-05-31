import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader.jsx'
import AudioRecorder from './pages/AudioRecorder.jsx'
import RandomNum from './pages/RandomNum.jsx'
import TranscriptionPage from './pages/TranscriptionPage.jsx'

function App() {
  useEffect(() => {
    // solicitamos permiso de audio al montar la app
    async function askMicPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // detenemos inmediatamente para no retener el micrófono
        stream.getTracks().forEach(t => t.stop())
      } catch (err) {
        console.warn('Permiso de micrófono denegado o error:', err)
      }
    }
    askMicPermission()
  }, [])

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