import React, { useState, useEffect, useRef } from 'react'
import menuIcon from '../assets/logo3.png'
import menuIconHover from '../assets/menu_sb_c_h.svg'
import closeIcon from '../assets/close_menu_sb_f.svg'
import closeIconHover from '../assets/close_menu_sb_f_h.svg'

import addChat from '../assets/add_chat_sb_c.svg'
import addChatHover from '../assets/add_chat_sb_c_h.svg'
import addChatFull from '../assets/add_chat_sb_f2.svg'

import VolumeUp from '../assets/volume_up_sb_c.svg'
import VolumeUpHover from '../assets/volume_up_sb_c_h.svg'
import VolumeUpFull from '../assets/volume_up_sb_f2.svg'

import ChatIcon from '../assets/chat_sb_c.svg'
import ChatIconHover from '../assets/chat_sb_c_h.svg'

import '../styles/Sidebar.css'

function MenuItem({ href, label, icon, iconHover, open }) {
  const [hover, setHover] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const Tag = href ? 'a' : 'button'
  const props = href ? { href } : {}

  return (
    <Tag
      {...props}
      className={`menu-item ${open ? 'open' : 'collapsed'}`}
      onMouseEnter={() => {
        setHover(true)
        if (!open) setShowTip(true)
      }}
      onMouseLeave={() => {
        setHover(false)
        setShowTip(false)
      }}
      aria-label={!open ? label : undefined}
    >
      <img
        className="menu-icon"
        src={hover ? iconHover : icon}
        alt={label}
      />
      {open && <span className="menu-label">{label}</span>}

      {/* tooltip personalizado */}
      {showTip && (
        <div className="tooltip">
          {label}
        </div>
      )}
    </Tag>
  )
}


export default function Sidebar({ children }) {
  const [open, setOpen] = useState(false)
  const [icon, setIcon] = useState(menuIcon)
  const sidebarRef   = useRef(null)
  const mobileNavRef = useRef(null)

  const onToggle = () => {
    setOpen(o => !o)
    setIcon(open ? menuIcon : closeIcon)  // cambia el icono base
  }

  useEffect(() => {
    function handleClickOutside(e) {
      // solo en móvil (<765px) y si está abierto
      if (
        open &&
        window.innerWidth <= 765 &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className={`app-container ${open ? 'sidebar-open' : ''}`}>
      <div className="mobile-navbar" ref={mobileNavRef}>
        <button
          className="mobile-toggle-btn"
          onClick={onToggle}
          onMouseEnter={() => setIcon(open ? closeIconHover : menuIconHover)}
          onMouseLeave={() => setIcon(open ? closeIcon : menuIcon)}
        >
          <img src={icon} alt="toggle menu" />
        </button>
      </div>

      <aside className="sidebar" ref={sidebarRef}>
        <div className='logo-container'>
            <a
            href="/"
            className="logo-text"
            >
            VocalisAI
            </a>
            <button
            className="toggle-btn"
            onClick={onToggle}
            onMouseEnter={() => setIcon(open ? closeIconHover : menuIconHover)}
            onMouseLeave={() => setIcon(open ? closeIcon : menuIcon)}
            >
                <img src={icon} alt="toggle sidebar" />
            </button>
        </div>

        {open
            ? (
            <nav className="menu menu-open">
                <MenuItem
                    href="/"
                    label="Nuevo Chat"
                    icon={addChatFull}
                    iconHover={addChatFull}
                    open={open}
                />
                <MenuItem
                    href="/"
                    label="Texto a voz"
                    icon={VolumeUpFull}
                    iconHover={VolumeUpFull}
                    open={open}
                />
                {/* …en abierto mostramos icon+texto… */}

                <p className="chats-links">
                    Chats
                </p>
                
            </nav>
            )
            : (
            <nav className="menu menu-collapsed">
                <MenuItem
                    href="/"
                    label="Chats"
                    icon={ChatIcon}
                    iconHover={ChatIconHover}
                    open={closed}
                />
                <MenuItem
                    href="/"
                    label="Nuevo Chat"
                    icon={addChat}
                    iconHover={addChatHover}
                    open={closed}
                />
                <MenuItem
                    href="/"
                    label="Texto a voz"
                    icon={VolumeUp}
                    iconHover={VolumeUpHover}
                    open={closed}
                />
                {/* …en cerrado sólo iconos y tooltip… */}
            </nav>
            )
        }
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}