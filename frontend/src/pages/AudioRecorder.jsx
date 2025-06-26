import { useRef, useState } from 'react'
import api from '../services/api'
import Loader from '../components/Loader'
import micIcon from '../assets/micro.png'
import '../styles/AudioRecorder.css'

const MAX_DURATION = 6 // segundos

// Añadir prop onTranscriptionComplete para comunicarse con el padre
const AudioRecorder = ({ onTranscriptionComplete }) => {
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const timerRef        = useRef(null)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [elapsed, setElapsed]     = useState(0)
  
  // Ya no necesitamos navigate
  // const navigate = useNavigate()

  const startRecording = async () => {
    setElapsed(0)
    setRecording(true)
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = +(prev + 0.1).toFixed(1)
        if (next >= MAX_DURATION) {
          clearInterval(timerRef.current)
          stopRecording()
          return MAX_DURATION
        }
        return next
      })
    }, 100)
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
    clearInterval(timerRef.current)
    setRecording(false)
    
    // Asegurarse de que mediaRecorderRef.current existe
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        processFile(blob)
        
        // Liberar recursos del micrófono
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
      }
      
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }

  const processFile = async blob => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', blob, 'audio.webm')
    try {
      const { data } = await api.post('/speech-to-text', formData)
      
      // En lugar de navegar, enviamos la transcripción al componente padre
      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.transcript)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error al transcribir:', error)
      alert('Error al transcribir')
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className='container-mega'>
      <div className="recorder-container select-none">
          <div className="mic-wrapper">
            <button
              type="button"
              className={`mic-icon ${recording ? 'recording' : ''}`}
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              onPointerDown={e => {
                e.preventDefault()
                startRecording()
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerUp={e => {
                e.preventDefault()
                stopRecording()
                e.currentTarget.releasePointerCapture(e.pointerId)
              }}
              onPointerCancel={e => {
                e.preventDefault()
                stopRecording()
              }}
              onTouchStart={e => {
                e.preventDefault()
                startRecording()
              }}
              onTouchEnd={e => {
                e.preventDefault()
                stopRecording()
              }}
            >
              <img src={micIcon} alt="Mic" className="mic-icon-image" />
            </button>

            {recording && (
              <>
                <span className="wave wave1" />
                <span className="wave wave2" />
                <span className="wave wave3" />
              </>
            )}
          </div>
        </div>
        <div className="progress-bar-bg">
            <div
              className="progress-bar"
              style={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
            />
        </div>
    </div>
  )
}

export default AudioRecorder