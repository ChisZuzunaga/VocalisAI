// import { useState, useRef, useEffect } from 'react';
// import '../styles/ChatBot.css';
// import botAvatar from '../assets/logo_blue.png';

// function Chatbot() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const messagesEndRef = useRef(null);
//   const [shouldScroll, setShouldScroll] = useState(false);
//   const [isWaiting, setIsWaiting] = useState(false); // Estado para bloquear input mientras esperamos
  
//   // Función específica para el autoscroll
//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//       window.scrollTo({
//         top: document.documentElement.scrollHeight,
//         behavior: 'smooth'
//       });
//     }, 100);
//   };
  
//   // Efecto para controlar el scroll solo cuando sea necesario
//   useEffect(() => {
//     if (shouldScroll) {
//       scrollToBottom();
//       setShouldScroll(false);
//     }
//   }, [messages, shouldScroll]);

//   const sendMessage = async () => {
//     if (!input.trim() || isWaiting) return; // No enviar si está esperando o input vacío

//     const userMessage = { sender: "user", text: input };
    
//     // Activar scroll y bloqueo de input
//     setShouldScroll(true);
//     setIsWaiting(true); // Bloquear el input
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");

//     try {
//       const res = await fetch("http://localhost:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: input })
//       });

//       const data = await res.json();
//       if (data.messages) {
//         setMessages((prev) => [...prev, data.messages[1]]);
//       }
//     } catch (err) {
//       setMessages((prev) => [...prev, { 
//         sender: "bot", 
//         text: "Lo siento, hubo un error al procesar tu mensaje."
//       }]);
//     } finally {
//       setIsWaiting(false); // Desbloquear el input cuando terminamos
//     }
//   };

//   return (
//     <div className='container-chat'>
      
//       <div className="messages-container">
//         {/* Mensaje de bienvenida centrado cuando no hay mensajes */}
//         {messages.length === 0 && (
//           <div className="message bot-message welcome-message">
//             <div className="avatar-container">
//               <img src={botAvatar} alt="Bot" className="bot-avatar" />
//             </div>
//             <div className="message-bubble">
//               <p>¿Qué deseas consultar hoy?</p>
//             </div>
//           </div>
//         )}
        
//         {/* Mensajes de la conversación */}
//         {messages.map((msg, idx) => (
//           <div 
//             key={idx} 
//             className={`message ${msg.sender === "user" ? 'user-message' : 'bot-message'}`}
//           >
//             {msg.sender === "bot" && (
//               <div className="avatar-container">
//                 <img src={botAvatar} alt="Bot" className="bot-avatar" />
//               </div>
//             )}
//             <div className="message-bubble">
//               <p>{msg.text}</p>
//             </div>
//           </div>
//         ))}

//         {/* Indicador de "escribiendo..." cuando estamos esperando */}
//         {isWaiting && (
//           <div className="message bot-message">
//             <div className="avatar-container">
//               <img src={botAvatar} alt="Bot" className="bot-avatar" />
//             </div>
//             <div className="message-bubble typing-indicator">
//               <span></span>
//               <span></span>
//               <span></span>
//             </div>
//           </div>
//         )}
        
//         <div ref={messagesEndRef} />
//       </div>
      
//       <div className='input-container'>
//         <form onSubmit={(e) => {
//           e.preventDefault();
//           sendMessage();
//         }}>
//           <input
//             type="text"
//             value={input}
//             placeholder={isWaiting ? "Esperando respuesta..." : "Escribe un mensaje..."}
//             onChange={(e) => setInput(e.target.value)}
//             disabled={isWaiting} // Deshabilitar mientras espera
//           />
//           <button 
//             type="submit" 
//             disabled={isWaiting || !input.trim()} // Deshabilitar si está esperando o no hay texto
//             className={isWaiting ? "waiting" : ""}
//           >
//             {isWaiting ? "..." : "Enviar"}
//           </button>
//         </form>
        
//         {/* Barra de progreso simple para la grabación */}
//       </div>
//     </div>
//   );
// }

// export default Chatbot;