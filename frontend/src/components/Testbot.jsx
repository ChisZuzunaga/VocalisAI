import { useState, useRef, useEffect } from 'react';
import '../styles/ChatBot.css';
import '../styles/Listas.css';
import botAvatar from '../assets/LOGOICONO.png';
import micIcon from '../assets/micro.png';
import api from '../services/api';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';

// Registrar lenguajes comunes
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('sql', sql);

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  
  // Estados para la grabación de audio
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const MAX_DURATION = 15; // segundos de grabación máxima
  
  // Función mejorada para procesar y formatear mensajes con soporte a múltiples formatos
  const formatMessage = (text) => {
    if (!text) return null;
    
    // Si el texto no contiene marcadores especiales, devolver como texto plano
    if (!/```|\*|\||>|-|#|`|\d+\.|•/.test(text)) {
      return <p>{text}</p>;
    }
    
    let processedContent = [];
    let currentText = text;
    let currentIndex = 0;
    let key = 0;
    
    // 1. Procesar bloques de código
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Añadir texto anterior al bloque de código
      if (match.index > currentIndex) {
        const textSegment = text.substring(currentIndex, match.index);
        processedContent.push(
          <div key={key++}>
            {parseInlineFormats(textSegment)}
          </div>
        );
      }
      
      // Obtener lenguaje y código
      const language = match[1] || 'javascript';
      const code = match[2];
      
      // Añadir el bloque de código con resaltado
      processedContent.push(
        <div className="code-block-wrapper" key={key++}>
          <div className="code-header">
            <span className="code-language">{language}</span>
            <button 
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(code)}
            >
              Copiar
            </button>
          </div>
          <SyntaxHighlighter 
            language={language} 
            style={vscDarkPlus}
            className="code-block"
            wrapLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Añadir cualquier texto restante después del último bloque de código
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      processedContent.push(
        <div key={key++}>
          {parseInlineFormats(remainingText)}
        </div>
      );
    }
    
    return <>{processedContent.length ? processedContent : <p>{text}</p>}</>;
  };
  
  // Función para procesar formatos en línea y elementos como tablas y listas
  const parseInlineFormats = (text) => {
    if (!text) return null;
    
    let segments = [];
    let currentIndex = 0;
    
    // Separar el texto por líneas para procesar elementos multilinea como tablas y listas
    const lines = text.split('\n');
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // 1. Procesar tablas
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        let j = i;
        
        // Recopilar todas las líneas de la tabla
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          tableLines.push(lines[j]);
          j++;
        }
        
        // Si tenemos al menos una línea de tabla y una línea de separación
        if (tableLines.length >= 3) {
          segments.push(parseTable(tableLines));
          i = j;
          continue;
        }
      }
      
      // 2. Procesar listas numeradas
      if (/^\s*\d+\.\s/.test(line)) {
        const listItems = [];
        let j = i;
        
        while (j < lines.length && /^\s*\d+\.\s/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\s*\d+\.\s/, ''));
          j++;
        }
        
        segments.push(
          <ol className="markdown-list ordered" key={`ol-${i}`}>
            {listItems.map((item, index) => (
              <li key={`li-${i}-${index}`}>{parseInlineText(item)}</li>
            ))}
          </ol>
        );
        i = j;
        continue;
      }
      
      // 3. Procesar listas con viñetas
      if (/^\s*[-*•]\s/.test(line)) {
        const listItems = [];
        let j = i;
        
        while (j < lines.length && /^\s*[-*•]\s/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\s*[-*•]\s/, ''));
          j++;
        }
        
        segments.push(
          <ul className="markdown-list unordered" key={`ul-${i}`}>
            {listItems.map((item, index) => (
              <li key={`li-${i}-${index}`}>{parseInlineText(item)}</li>
            ))}
          </ul>
        );
        i = j;
        continue;
      }
      
      // 4. Procesar encabezados
      if (/^#+\s/.test(line)) {
        const level = line.match(/^(#+)/)[0].length;
        if (level >= 1 && level <= 6) {
            const content = line.replace(/^#+\s/, '');
            
            segments.push(
            <div 
                className={`markdown-h${level}`} 
                key={`h-${i}`}
                id={`heading-${content.toLowerCase().replace(/\s+/g, '-')}`} // Añade ID para posibles anclajes
            >
                {parseInlineText(content)}
            </div>
            );
            i++;
            continue;
        }
     }
      
      // 5. Procesar citas
      if (/^\s*>\s/.test(line)) {
        const quoteLines = [];
        let j = i;
        
        while (j < lines.length && /^\s*>\s/.test(lines[j])) {
          quoteLines.push(lines[j].replace(/^\s*>\s/, ''));
          j++;
        }
        
        segments.push(
          <blockquote className="markdown-blockquote" key={`quote-${i}`}>
            {parseInlineText(quoteLines.join('\n'))}
          </blockquote>
        );
        i = j;
        continue;
      }
      
      // 6. Procesar líneas horizontales
      if (/^\s*[-*_]{3,}\s*$/.test(line)) {
        segments.push(<hr className="markdown-hr" key={`hr-${i}`} />);
        i++;
        continue;
      }
      
      // 7. Línea normal
      segments.push(
        <p key={`p-${i}`}>{parseInlineText(line)}</p>
      );
      i++;
    }
    
    return <>{segments}</>;
  };
  
  // Procesar formatos en línea (negritas, cursivas, código)
  const parseInlineText = (text) => {
    if (!text) return '';
    
    let parts = [];
    let currentIndex = 0;
    let key = 0;
    
    // Código en línea
    const inlineCodeRegex = /`([^`]+)`/g;
    let match;
    
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push(parseStyleFormatting(text.substring(currentIndex, match.index), key++));
      }
      
      parts.push(
        <code className="inline-code" key={key++}>
          {match[1]}
        </code>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    if (currentIndex < text.length) {
      parts.push(parseStyleFormatting(text.substring(currentIndex), key++));
    }
    
    return <>{parts}</>;
  };
  
  // Procesar negritas y cursivas
  const parseStyleFormatting = (text, key) => {
    if (!text) return '';
    
    // Reemplazar negrita
    text = text.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      return `<b>${content}</b>`;
    });
    
    // Reemplazar cursiva
    text = text.replace(/\*(.+?)\*/g, (_, content) => {
      return `<i>${content}</i>`;
    });
    
    // Si no hay tags HTML, devolver el texto sin procesar
    if (!/<[^>]+>/.test(text)) {
      return text;
    }
    
    // Convertir el texto con tags a elementos React
    return <span key={key} dangerouslySetInnerHTML={{ __html: text }} />;
  };
  
  // Función para parsear tablas
  const parseTable = (tableLines) => {
    // Eliminar la línea de separación (segunda línea)
    const headerLine = tableLines[0];
    const dataLines = tableLines.slice(2);
    
    // Procesar encabezados
    const headers = headerLine
      .trim()
      .split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim());
    
    // Procesar filas
    const rows = dataLines.map(line => {
      return line
        .trim()
        .split('|')
        .filter(cell => cell.trim() !== '')
        .map(cell => cell.trim());
    });

    return (
      <div className="markdown-table-container" key={`table-${tableLines[0]}`}>
        <table className="markdown-table">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={`th-${i}`}>{parseInlineText(header)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`tr-${i}`}>
                {row.map((cell, j) => (
                  <td key={`td-${i}-${j}`}>{parseInlineText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Función específica para el autoscroll
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };
  
  // Efecto para controlar el scroll solo cuando sea necesario
  useEffect(() => {
    if (shouldScroll) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  // Función para iniciar la grabación de audio
  const startRecording = async () => {
    if (isWaiting) return; // No grabar si está esperando respuesta
    
    setElapsed(0);
    setRecording(true);
    
    // Iniciar temporizador
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = +(prev + 0.1).toFixed(1);
        if (next >= MAX_DURATION) {
          clearInterval(timerRef.current);
          stopRecording();
          return MAX_DURATION;
        }
        return next;
      });
    }, 100);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error al iniciar la grabación:", error);
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Función para detener la grabación
  const stopRecording = () => {
    if (!recording || !mediaRecorderRef.current) return;
    
    clearInterval(timerRef.current);
    setRecording(false);
    
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processAudio(blob);
      
      // Detener todas las pistas de audio
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current.stop();
  };

  // Procesar el audio grabado
  const processAudio = async (blob) => {
    setIsWaiting(true); // Indicar que estamos procesando
    
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    
    try {
      const { data } = await api.post('/speech-to-text', formData);
      if (data.transcript && data.transcript.trim()) {
        setInput(data.transcript); // Colocar el texto en el input
      } else {
        console.log("No se pudo transcribir el audio");
      }
    } catch (error) {
      console.error("Error al transcribir:", error);
    } finally {
      setIsWaiting(false); // Terminamos de procesar
    }
  };

  // Enviar mensaje (código existente)
  const sendMessage = async () => {
    if (!input.trim() || isWaiting) return;

    const userMessage = { sender: "user", text: input };
    
    setShouldScroll(true);
    setIsWaiting(true);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => [...prev, data.messages[1]]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Lo siento, hubo un error al procesar tu mensaje."
      }]);
    } finally {
      setIsWaiting(false);
    }
  };

  return (
    <div className='container-chat'>
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="message bot-message welcome-message">
            <div className="avatar-container">
              <img src={botAvatar} alt="Bot" className="bot-avatar" />
            </div>
            <div className="message-bubble">
              <p>¿Qué deseas consultar hoy?</p>
            </div>
          </div>
        )}
        
        {/* Mensajes con formato de código */}
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`message ${msg.sender === "user" ? 'user-message' : 'bot-message'}`}
          >
            {msg.sender === "bot" && (
              <div className="avatar-container">
                <img src={botAvatar} alt="Bot" className="bot-avatar" />
              </div>
            )}
            <div className="message-bubble">
              {formatMessage(msg.text)}
            </div>
          </div>
        ))}

        {isWaiting && (
          <div className="message bot-message">
            <div className="avatar-container">
              <img src={botAvatar} alt="Bot" className="bot-avatar" />
            </div>
            <div className="message-bubble typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className='input-container'>
        <form onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}>
          <input
            type="text"
            value={input}
            placeholder={
              recording ? "Grabando audio..." : 
              isWaiting ? "Esperando respuesta..." : 
              "Escribe un mensaje o pulsa el micrófono"
            }
            onChange={(e) => setInput(e.target.value)}
            disabled={isWaiting || recording}
          />
          
          {/* Botón de micrófono */}
          <button 
            type="button"
            className={`mic-button ${recording ? 'recording' : ''}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!recording) startRecording();
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              if (recording) stopRecording();
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              if (recording) stopRecording();
            }}
            disabled={isWaiting}
          >
            <img 
              src={micIcon} 
              alt="Micrófono" 
              className="mic-icon-small" 
            />
            {recording && (
              <div className="recording-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </button>
          
          <button 
            type="submit" 
            disabled={isWaiting || !input.trim() || recording}
            className={isWaiting ? "waiting" : ""}
          >
            {isWaiting ? "..." : "Enviar"}
          </button>
        </form>
        
        {recording && (
          <div className="recording-progress">
            <div className="recording-time">{elapsed.toFixed(1)}s</div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar" 
                style={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chatbot;