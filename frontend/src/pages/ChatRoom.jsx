// src/pages/ChatRoom.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatRoom = () => {
  const { conversationId } = useParams(); 
  const { user } = useAuth(); 
  
  const [messages, setMessages] = useState([]);
  const [forumName, setForumName] = useState('Forum');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data } = await api.get(`/chat/${conversationId}/messages`);
      // Only update messages if there are new ones
      setMessages(prevMessages => {
        if (prevMessages.length !== data.messages.length) {
          // If there are new messages and the last one is from someone else, scroll
          if (data.messages.length > 0 && 
              data.messages[data.messages.length - 1]?.sender._id !== user.userId) {
            setTimeout(scrollToBottom, 100);
          }
          return data.messages;
        }
        return prevMessages;
      });
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, [conversationId, user.userId]);

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
      }
    };
    initializeChat();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || isSessionLoading) return;
    const intervalId = setInterval(() => { fetchMessages() }, 5000);
    return () => clearInterval(intervalId);
  }, [conversationId, isSessionLoading, fetchMessages]);

  useEffect(() => {
    const shouldScroll = messages.length > 0 && 
      messages[messages.length - 1]?.sender._id === user.userId;
    if (shouldScroll) {
      scrollToBottom();
    }
  }, [messages, user.userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;
    
    setIsLoading(true);
    const textToSend = input;
    setInput('');
    
    try {
      await api.post(`/chat/${conversationId}/messages`, { text: textToSend });
      await fetchMessages();
    } catch (err) {
      setError('Failed to send the message.');
      setInput(textToSend);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Paper
        elevation={4}
        sx={{
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 800,
          margin: '0 auto',
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            borderBottom: 1, 
            borderColor: 'rgba(59, 130, 246, 0.1)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1e3a8a',
              fontWeight: '600',
              mb: 0.5
            }}
          >
            {forumName}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#4b5563'
            }}
          >
            Public Forum | Logged in as: {user.name}
          </Typography>
        </Box>

      {error && <Alert severity="error" sx={{ m: 1, mx: 2 }}>{error}</Alert>}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: 'rgba(255, 255, 255, 0.5)' }}>
        {messages.map((msg, idx) => (
          <React.Fragment key={msg._id}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  minWidth: 120, 
                  flexShrink: 0,
                  color: '#4b5563',
                  fontWeight: '600',
                  pt: 0.5
                }}
              >
                {msg.sender.name}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  ml: 2,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: msg.sender._id === user.userId ? '#2563eb' : '#1f2937',
                  fontWeight: msg.sender._id === user.userId ? '500' : '400',
                  flex: 1,
                  maxWidth: 'calc(100% - 140px)'  // account for name width and margin
                }}
              >
                {msg.text}
              </Typography>
            </Box>
            {idx < messages.length - 1 && 
              <Box 
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'rgba(59, 130, 246, 0.1)',
                  my: 2
                }} 
              />
            }
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box 
        component="form" 
        onSubmit={handleSendMessage} 
        sx={{ 
          p: 3, 
          borderTop: 1, 
          borderColor: 'rgba(59, 130, 246, 0.1)',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isSessionLoading}
            autoComplete="off"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                color: '#000000',
                '&:hover': {
                  border: '2px solid #3b82f6',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                    borderWidth: '2px'
                  },
                },
                '&.Mui-focused': {
                  border: '2px solid #3b82f6',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                    borderWidth: '2px'
                  },
                },
              },
              '& .MuiOutlinedInput-input': {
                color: '#000000',
                '&::placeholder': {
                  color: '#6b7280',
                  opacity: 1
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
                borderColor: '#e5e7eb'
              }
            }}
          />
          <IconButton
            type="submit"
            disabled={isLoading || isSessionLoading || !input.trim()}
            sx={{ 
              ml: 1, 
              p: '12px',
              bgcolor: '#3b82f6',
              color: 'white',
              '&:hover': {
                bgcolor: '#2563eb',
              },
              '&.Mui-disabled': {
                bgcolor: '#e5e7eb',
                color: '#9ca3af'
              }
            }}
            aria-label="send message"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
    </div>
  );
};

export default ChatRoom;