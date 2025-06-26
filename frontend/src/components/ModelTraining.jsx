import React, { useState, useEffect, useRef } from 'react';
import '../styles/ModelTraining.css';
import api from '../services/api';
import Loader from './Loader';

const ModelTraining = () => {
  const [recording, setRecording] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Cargar estadísticas al inicio
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Solicitando estadísticas...');
      
      // Usar la URL correcta
      const response = await api.get('/training/training-data-stats/');
      console.log('Respuesta de estadísticas:', response.data);
      
      // Verificar que la respuesta tenga la estructura esperada
      const data = response.data;
      
      if (data && data.samples) {
        console.log('Datos recibidos:', data);
        setStats(data);
        
        // Limpiar cualquier mensaje de error previo
        if (message.includes('Error')) {
          setMessage('');
        }
      } else if (data && data.error) {
        console.error('Error del servidor:', data.error);
        setMessage(data.error);
        
        // Establecer stats con valores por defecto
        setStats({
          samples: { si: 0, no: 0, total: 0 },
          model: { exists: false, size_kb: 0, last_modified: null }
        });
      } else {
        console.error('Formato de respuesta inesperado:', data);
        setMessage('Error: formato de respuesta inesperado del servidor');
        
        // Establecer stats con valores por defecto
        setStats({
          samples: { si: 0, no: 0, total: 0 },
          model: { exists: false, size_kb: 0, last_modified: null }
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      
      // Mostrar detalles específicos del error
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error('Error de respuesta:', error.response.status, error.response.data);
        setMessage(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.error('Error de solicitud - sin respuesta');
        setMessage('Error: no se recibió respuesta del servidor');
      } else {
        // Algo ocurrió al configurar la solicitud
        console.error('Error de configuración:', error.message);
        setMessage(`Error: ${error.message || 'Error desconocido'}`);
      }
      
      // Establecer stats con valores por defecto
      setStats({
        samples: { si: 0, no: 0, total: 0 },
        model: { exists: false, size_kb: 0, last_modified: null }
      });
    } finally {
      setLoading(false);
    }
  };
    
  // En tu componente ModelTraining.jsx
  const startRecording = async (classType) => {
    try {
      setCurrentClass(classType);
      setRecording(true);
      setMessage(`Grabando audio para "${classType}". Habla ahora...`);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { 
        mimeType: 'audio/webm' 
      };
      
      // Inicializar el MediaRecorder con el stream y las opciones
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // Limpiar el array de chunks
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        // Crear el blob de audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio grabado: ${audioBlob.size} bytes, tipo: ${audioBlob.type}`);
        
        // Guardar el audio
        await saveAudio(audioBlob, classType);
        
        // Liberar el stream
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Iniciar la grabación
      mediaRecorderRef.current.start();
      
      // Detener la grabación después de 3 segundos
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 3000);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      setMessage('Error al acceder al micrófono');
      setRecording(false);
    }
  };
  
  const saveAudio = async (audioBlob, classType) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Cambiar la extensión de .wav a .webm para reflejar el formato correcto
      formData.append('audio', audioBlob, `${classType}_audio.webm`);
      
      console.log('Guardando audio para clase:', classType);
      console.log('Tipo de blob:', audioBlob.type);
      console.log('Tamaño de blob:', audioBlob.size, 'bytes');
      
      const endpoint = `/training/save-training-audio/?class_type=${classType}`;
      console.log('URL de la petición:', endpoint);
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        setMessage(`Audio "${classType}" guardado correctamente en ${response.data.path}`);
        // Esperar un poco antes de actualizar las estadísticas
        setTimeout(() => {
          fetchStats();
        }, 1000);
      } else {
        setMessage(`Error: ${response.data.error || 'Respuesta inesperada'}`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Detalles de respuesta:', error.response?.data);
      setMessage(`Error en la comunicación con el servidor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const startTraining = async () => {
    try {
      setLoading(true);
      setTrainingStarted(true);
      setMessage('Iniciando entrenamiento del modelo...');
      
      const response = await api.post('/training/train-model/');
      
      if (response.data.success) {
        setMessage('Entrenamiento iniciado en segundo plano. Este proceso puede tardar varios minutos.');
      } else {
        setMessage('Error al iniciar el entrenamiento');
        setTrainingStarted(false);
      }
    } catch (error) {
      console.error('Error al iniciar el entrenamiento:', error);
      setMessage('Error en la comunicación con el servidor');
      setTrainingStarted(false);
    } finally {
      setLoading(false);
    }
  };
  
  const predictCustom = async () => {
    try {
      setLoading(true);
      setMessage('Grabando audio para predicción...');
      setRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { 
        mimeType: 'audio/webm' 
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio para predicción: ${audioBlob.size} bytes`);
        await predictAudio(audioBlob);
        
        // Liberar el stream
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current.start();
      
      // Detener la grabación después de 3 segundos
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 3000);
    } catch (error) {
      console.error('Error al iniciar la grabación para predicción:', error);
      setMessage('Error al acceder al micrófono');
      setRecording(false);
      setLoading(false);
    }
  };
  
  const predictAudio = async (audioBlob) => {
    try {
      setMessage('Enviando audio para predicción...');
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await api.post('/training/predict-custom/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setMessage(`Predicción: ${response.data.prediction}`);
      } else {
        setMessage(`Error en la predicción: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error al realizar la predicción:', error);
      setMessage('Error en la comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !recording) {
    return <Loader />;
  }
  
  return (
    <div className="model-training-container">
      <h1>Entrenamiento del Modelo Personalizado</h1>
      
      <div className="stats-container">
        <h2>Estadísticas</h2>
        {stats ? (
          // Modifica la parte donde se muestra la estadística para añadir validaciones

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Muestras "Sí"</h3>
            <p className="stat-number">
              {stats && stats.samples ? stats.samples.si : 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Muestras "No"</h3>
            <p className="stat-number">
              {stats && stats.samples ? stats.samples.no : 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Muestras</h3>
            <p className="stat-number">
              {stats && stats.samples ? stats.samples.total : 0}
            </p>
          </div>
          <div className="stat-card model-info">
            <h3>Modelo</h3>
            <p>
              {stats && stats.model ? 
                (stats.model.exists ? `${stats.model.size_kb} KB` : "No existe") 
                : "Sin información"}
            </p>
            {stats && stats.model && stats.model.last_modified && (
              <p className="last-modified">
                Última actualización: {new Date(stats.model.last_modified * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        ) : (
          <p>Cargando estadísticas...</p>
        )}
      </div>
      
      <div className="training-actions">
        <h2>Grabación de Muestras</h2>
        <div className="record-buttons">
          <button
            className={`record-button yes ${recording && currentClass === 'si' ? 'recording' : ''}`}
            onClick={() => !recording && startRecording('si')}
            disabled={recording}
          >
            Grabar "Sí"
            {recording && currentClass === 'si' && (
              <div className="recording-animation"></div>
            )}
          </button>
          
          <button
            className={`record-button no ${recording && currentClass === 'no' ? 'recording' : ''}`}
            onClick={() => !recording && startRecording('no')}
            disabled={recording}
          >
            Grabar "No"
            {recording && currentClass === 'no' && (
              <div className="recording-animation"></div>
            )}
          </button>
        </div>
        
        <div className="training-controls">
          <button 
            className="train-button"
            onClick={startTraining}
            disabled={
              recording || 
              loading || 
              trainingStarted || 
              !stats || 
              (stats.samples && stats.samples.total < 10)
            }
          >
            Entrenar Modelo
          </button>
          
          <button 
            className="predict-button"
            onClick={predictCustom}
            disabled={recording || loading || !stats || !stats.model.exists}
          >
            Probar Modelo
          </button>
        </div>
        
        {message && (
          <div className="message-container">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTraining;