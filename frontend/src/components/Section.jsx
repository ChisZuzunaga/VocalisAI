import React, { useState } from 'react';
import AudioRecorder from '../pages/AudioRecorder.jsx';
import '../styles/Section.css';

const Section = () => {
  // Añadir estado para almacenar la transcripción
  const [transcript, setTranscript] = useState('');
  
  // Función para manejar la transcripción completada
  const handleTranscriptionComplete = (text) => {
    setTranscript(text);
  };

  return (
    <div className="container-section">
      <section className="section-left recorder-container">
        <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
      </section>
      <section className="section-right">
        {transcript ? (
          <div className="transcript-container">
            <h3>Transcripción:</h3>
            <div className="transcript-text">{transcript}</div>
            <div className="transcript-actions">
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(transcript)}
              >
                Copiar texto
              </button>
              <button 
                className="clear-button"
                onClick={() => setTranscript('')}
              >
                Limpiar
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-transcript">
            <p>Mantén presionado el micrófono y habla para crear una transcripción</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Section;