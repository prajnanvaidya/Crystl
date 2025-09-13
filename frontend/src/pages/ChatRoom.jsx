import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaPaperPlane, FaSpinner, FaClock, FaArrowDown } from 'react-icons/fa';

const ChatRoom = () => {
  const { conversationId } = useParams(); 
  const { user } = useAuth(); 
  
  const [messages, setMessages] = useState([]);
  const [forumName, setForumName] = useState('Forum');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data } = await api.get(`/chat/${conversationId}/messages`);
      setMessages(data.messages);
      
      // After fetching messages, check if we should scroll to bottom
      setTimeout(() => {
        checkScrollPosition();
      }, 100);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, [conversationId]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!conversationId) {
        setError('No forum thread specified.');
        setIsSessionLoading(false);
        return;
      }
      setIsSessionLoading(true);
      setError('');
      try {
        const detailsPromise = api.get(`/chat/${conversationId}`);
        const messagesPromise = api.get(`/chat/${conversationId}/messages`);
        const [detailsRes, messagesRes] = await Promise.all([detailsPromise, messagesPromise]);
        
        setForumName(detailsRes.data.conversation.departmentParticipant.name);
        setMessages(messagesRes.data.messages);

      } catch (err) {
        setError('Failed to load forum thread.');
      } finally {
        setIsSessionLoading(false);
        
        // Scroll to bottom after initial load
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };
    initializeChat();
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;
    
    setIsLoading(true);
    const textToSend = input;
    setInput('');
    
    try {
      await api.post(`/chat/${conversationId}/messages`, { text: textToSend });
      await fetchMessages();
      
      // Scroll to bottom after sending a message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      setError('Failed to send the message.');
      setInput(textToSend);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      // Today - show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Show date and time
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h1 className="text-2xl font-bold">{forumName}</h1>
          <p className="text-blue-100 mt-1">Public Forum | Logged in as: {user.name}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 m-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              {error}
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              &times;
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="h-96 overflow-y-auto p-6 bg-white/50 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent scrollbar-thumb-rounded-full relative"
          style={{ scrollbarWidth: 'thin' }}
          onScroll={checkScrollPosition}
        >
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={msg._id} className="group">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-28">
                    <div className={`text-sm font-medium ${
                      msg.sender._id === user.userId ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {msg.sender.name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <FaClock className="mr-1 text-xs" />
                      {formatTimestamp(msg.createdAt || msg.timestamp)}
                    </div>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    msg.sender._id === user.userId 
                      ? 'bg-blue-100 border border-blue-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <p className="text-gray-800 whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
                {idx < messages.length - 1 && (
                  <div className="border-t border-gray-200 my-3 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-36 right-1/2 transform translate-x-1/2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
            >
              <FaArrowDown />
            </button>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isSessionLoading}
              autoComplete="off"
              className="flex-1 px-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || isSessionLoading || !input.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center shadow-md"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin text-lg" />
              ) : (
                <FaPaperPlane className="text-lg" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;