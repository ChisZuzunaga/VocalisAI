import React from 'react';

const Footer = () => {

    const scrollToTop = () => {
        window.scrollTo({
        top: 0,
        behavior: 'smooth', // Desplazamiento suave
        });
    };

  return (
    <footer id="footer" className="p-footer text-black bg-footer flex items-center justify-between relative dp-links custom-footer">
      {/* Nombre a la izquierda */}
      <div className="text-lg font-light text-gray">
        &copy; VocalisAI.
      </div>

      {/* Lista de enlaces a la derecha */}
      <ul className="flex hd-links text-lg font-light text-gray">
        <li>
          <a href="/" className="hover:underline">
            Transcribir
          </a>
        </li>
        <li>
          <a href="/" className="hover:underline pdlr-50px">
            Chats
          </a>
        </li>
        <li>
          <a href="/" className="hover:underline">
            Ayuda
          </a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer