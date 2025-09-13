// src/components/chatbot/ChatbotPublic.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api'; // Adjust path if needed
import styles from './ChatbotPublic.module.css';
import { FaPaperPlane } from 'react-icons/fa';

const ChatbotPublic = ({ institutionId }) => {
  const [session, setSession] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSession = useCallback(async () => {
    if (!institutionId) return;
    try {
      const { data } = await api.post('/chatbot/session', { institutionId });
      setSession(data.session);
    } catch (err) {
      setError('Failed to load chat session.');
      console.error("Chat session error:", err);
    } finally {
      setIsSessionLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    setIsSessionLoading(true);
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !session?._id || isLoading) return;

    const newQuestion = input;
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', text: newQuestion, _id: `temp-${Date.now()}` }]
    }));
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      await api.post(`/chatbot/session/${session._id}/message`, { question: newQuestion });
      await fetchSession();
    } catch (err) {
      setError('Error fetching response. Please try again.');
      // Optional: remove optimistic message on failure
      setSession(prev => ({ ...prev, messages: prev.messages.slice(0, -1) }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        {isSessionLoading ? (
          <p className={styles.statusText}>Initializing AI Assistant...</p>
        ) : session?.messages?.length === 0 ? (
          <p className={styles.statusText}>Ask a question about this institution's finances.</p>
        ) : (
          session?.messages.map((msg) => (
            <div
              key={msg._id}
              className={msg.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot}
            >
              {msg.text}
            </div>
          ))
        )}
        {isLoading && <div className={styles.typingIndicator}><span></span><span></span><span></span></div>}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSendMessage} className={styles.inputArea}>
        <input
          type="text"
          className={styles.inputField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about spending..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={isLoading || isSessionLoading || !input.trim()}
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatbotPublic;