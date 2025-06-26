import React from 'react'
import '../styles/JumpLoader.css'

const JumpLoader = () => {
  const text = 'Transcribiendo mensaje . . .'

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex whitespace-pre">
        {text.split('').map((char, idx) => {
          if (char === ' ') {
            // renderiza los espacios sin animación
            return <span key={idx}>&nbsp;</span>
          }
          return (
            <span
              key={idx}
              className="jump-char text-white text-lg font-medium"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {char}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default JumpLoader