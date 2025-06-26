import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AudioRecorder from './pages/AudioRecorder.jsx'
import RandomNum from './pages/RandomNum.jsx'
import Section from './components/Section.jsx'
import Sidebar from './components/Sidebar.jsx'
import Chat from './components/Chatbot.jsx'
import ModelTraining from './components/ModelTraining';

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
          <Route path="/record" element={<Section />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/training' element={<ModelTraining />} />
        </Routes>
      </Sidebar>
    </BrowserRouter>
  )
}

export default App