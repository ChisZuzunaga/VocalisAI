import { useRef, useState } from "react";
import api from "../services/api";

const AudioRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("No se pudo acceder al micrófono:", err);
      alert("Permite el micrófono o revisa la consola");
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    mediaRecorderRef.current.stop();

    // espera a que se dispare onstop
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");

      try {
        const { status } = await api.post("/upload-audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (status === 200) {
          alert("Audio enviado con éxito");
        }
      } catch (err) {
        console.error("Error al enviar audio:", err);
        alert("Error al enviar");
      }
    };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        className={`px-6 py-3 rounded-full text-white ${
          recording ? "bg-red-500" : "bg-blue-500"
        }`}
      >
        {recording ? "Grabando..." : "Mantén para grabar"}
      </button>
    </div>
  );
};

export default AudioRecorder;