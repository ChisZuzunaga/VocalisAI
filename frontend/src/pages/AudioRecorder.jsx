import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Loader from '../components/Loader'

const AudioRecorder = () => {
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const [recording, setRecording] = useState(false)
  const [loading, setLoading]     = useState(false)
  const navigate = useNavigate()

  const startRecording = async () => {
    setRecording(true)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    audioChunksRef.current = []
    mediaRecorderRef.current.ondataavailable = e => {
      if (e.data.size) audioChunksRef.current.push(e.data)
    }
    mediaRecorderRef.current.start()
  }

  const stopRecording = () => {
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      processFile(blob)
    }
    mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const processFile = async blob => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', blob, 'audio.webm')
    try {
      const { data } = await api.post('/speech-to-text', formData)
      // al terminar la carga y procesado, navegamos pasándole la info
      navigate('/transcription', { state: { filename: data.filename, transcript: data.transcript } })
    } catch {
      alert('Error al transcribir')
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerCancel={stopRecording}
        onTouchStart={e => e.preventDefault()}
        onTouchEnd={e => e.preventDefault()}
        style={{ userSelect: 'none', touchAction: 'none' }}
        className={`px-6 py-3 rounded-full text-white ${
          recording ? 'bg-red-500' : 'bg-blue-500'
        }`}
      >
        {recording ? 'Grabando…' : 'Mantén para grabar'}
      </button>
    </div>
  )
}

export default AudioRecorder