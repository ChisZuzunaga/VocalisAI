import { useRef, useState } from "react"
import api from "../services/api"

const AudioRecorder = () => {
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const [recording, setRecording] = useState(false)
  const [filename, setFilename] = useState(null)
  const [transcript, setTranscript] = useState(null)

  const startRecording = async () => {
    try {
      setRecording(true)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      audioChunksRef.current = []
      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size) audioChunksRef.current.push(e.data)
      }
      mediaRecorderRef.current.start()
    } catch (err) {
      console.error("No se pudo acceder al micrófono:", err)
      alert("Permite el micrófono o revisa la consola")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      processFile(blob)
    }
    mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const processFile = async blob => {
    const formData = new FormData()
    formData.append("file", blob, "audio.webm")
    try {
      const { data } = await api.post("/speech-to-text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setFilename(data.filename)
      setTranscript(data.transcript)
    } catch (err) {
      console.error("Error al transcribir:", err)
      alert("Error al transcribir")
    }
  }

  const handleConfirm = async () => {
    try {
      await api.delete(`/audio/${filename}`)
      alert("Audio eliminado y transcripción aceptada")
      setFilename(null)
      setTranscript(null)
    } catch (err) {
      console.error("Error al eliminar:", err)
      alert("Error al eliminar")
    }
  }

  const handleRetry = async () => {
    try {
      // borra audio anterior
      if (filename) {
        await api.delete(`/audio/${filename}`)
      }
      // limpia estado y vuelve a grabar
      setFilename(null)
      setTranscript(null)
      alert("Se eliminará el audio anterior. Empieza a grabar de nuevo.")
      startRecording()
    } catch (err) {
      console.error("Error en reintento:", err)
      alert("Error al reintentar")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {filename === null ? (
        <button
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerCancel={stopRecording}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
          }}
          className={`px-6 py-3 rounded-full text-white ${
            recording ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          {recording ? "Grabando..." : "Mantén para grabar"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="p-4 bg-gray-800 rounded text-white max-w-md">
            {transcript}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 rounded text-white"
            >
              Correcto
            </button>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-yellow-500 rounded text-white"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder