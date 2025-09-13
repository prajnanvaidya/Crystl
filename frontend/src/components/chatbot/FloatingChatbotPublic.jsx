// src/components/chatbot/FloatingChatbotPublic.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { FaCommentDots, FaTimes, FaMinus } from 'react-icons/fa';
import ChatbotPublic from './ChatbotPublic';
import './FloatingChatbotPublic.css';

const FloatingChatbotPublic = ({ institutionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowState, setWindowState] = useState({
    x: Math.min(window.innerWidth - 400, window.innerWidth - 390),
    y: Math.max(window.innerHeight - 650, 10),
    width: 370,
    height: 600
  });
  const chatWindowRef = useRef(null);

  // Prevent scrolling when the chatbot opens
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      window.scrollTo(0, scrollY);
    }
  }, [isOpen]);

  // Don't render anything if there's no institutionId
  if (!institutionId) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="floating-chatbot-container">
        <button onClick={() => setIsOpen(true)} className="chatbot-fab" aria-label="Open AI Assistant">
          <FaCommentDots />
        </button>
      </div>
    );
  }

  return (
    <Rnd
      ref={chatWindowRef}
      default={windowState}
      minWidth={320}
      minHeight={isMinimized ? 50 : 400}
      bounds="window"
      className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}
      dragHandleClassName="chatbot-header"
      onDragStop={(e, d) => {
        setWindowState(prev => ({ ...prev, x: d.x, y: d.y }));
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setWindowState({
          x: position.x,
          y: position.y,
          width: ref.style.width,
          height: ref.style.height
        });
      }}
      enableResizing={!isMinimized}
      size={{ 
        width: isMinimized ? 320 : windowState.width, 
        height: isMinimized ? 50 : windowState.height 
      }}
      position={{ 
        x: isMinimized ? Math.min(window.innerWidth - 340, window.innerWidth - 330) : windowState.x, 
        y: isMinimized ? Math.min(window.innerHeight - 90, window.innerHeight - 60) : windowState.y 
      }}
    >
      <div className="chatbot-header">
        <h3>AI Financial Assistant</h3>
        <div className="chatbot-controls">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="minimize-btn" 
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <FaMinus />
          </button>
          <button 
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }} 
            className="close-btn" 
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      {!isMinimized && <ChatbotPublic institutionId={institutionId} />}
    </Rnd>
  );
};

export default FloatingChatbotPublic;