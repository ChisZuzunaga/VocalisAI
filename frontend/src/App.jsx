import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader.jsx'
import AudioRecorder from './pages/AudioRecorder.jsx'
import RandomNum from './pages/RandomNum.jsx'
import TranscriptionPage from './pages/TranscriptionPage.jsx'
import ChatLayout from './layouts/ChatLayout.jsx'
import Test from './layouts/Test.jsx'
import Sidebar from './components/Sidebar.jsx'
import Chat from './components/Chatbot.jsx'
import Testbot from './components/Testbot.jsx'

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <Sidebar>
        <Routes>
          <Route path="/" element={<RandomNum />} />
          <Route path="/loader" element={<Loader />} />
          <Route path="/transcription" element={<TranscriptionPage />} />
          <Route path="/record" element={<AudioRecorder />} />
          <Route path="/chat" element={<ChatLayout />} />
          <Route path="/ai" element={<Test />} />
          <Route path='/chatbot' element={<Chat />} />
          <Route path='/test' element={<Testbot />} />
        </Routes>
      </Sidebar>
    </BrowserRouter>
  )
}

export default App