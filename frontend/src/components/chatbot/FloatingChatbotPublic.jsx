// src/components/chatbot/FloatingChatbotPublic.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { FaCommentDots, FaTimes } from 'react-icons/fa';
import ChatbotPublic from './ChatbotPublic';
import './FloatingChatbotPublic.css'; // We'll create this next

const FloatingChatbotPublic = ({ institutionId }) => {
  const [isOpen, setIsOpen] = useState(false);

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
      default={{
        x: window.innerWidth - 400,
        y: window.innerHeight - 650,
        width: 370,
        height: 600,
      }}
      minWidth={320}
      minHeight={400}
      bounds="window"
      className="chatbot-window"
      dragHandleClassName="chatbot-header"
    >
      <div className="chatbot-header">
        <h3>AI Financial Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="close-btn" aria-label="Close chat">
          <FaTimes />
        </button>
      </div>
      {/* Pass the institutionId to the actual chatbot component */}
      <ChatbotPublic institutionId={institutionId} />
    </Rnd>
  );
};

export default FloatingChatbotPublic;