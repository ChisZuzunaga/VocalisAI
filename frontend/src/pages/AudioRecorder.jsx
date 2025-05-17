import { useRef, useState } from "react";

const AudioRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      fetch('http://localhost:8000/upload-audio', {
        method: 'POST',
        body: formData
      })
      .then(res => res.ok ? alert('Audio enviado con éxito') : alert('Error al enviar'))
      .catch(err => console.error(err));
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
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
