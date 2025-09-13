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
      setMessages(data.messages);
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
    scrollToBottom();
  }, [messages]);

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
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  return (
    <Paper
      elevation={4}
      sx={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 800,
        margin: '2rem auto',
        borderRadius: 2,
        bgcolor: '#212121'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{forumName}</Typography>
        <Typography variant="caption" color="text.secondary">
          Public Forum | Logged in as: {user.name}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ m: 1, mx: 2 }}>{error}</Alert>}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((msg, idx) => (
          <React.Fragment key={msg._id}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 120, flexShrink: 0 }}>
                {msg.sender.name}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  ml: 2,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  flexGrow: 1,
                  color: msg.sender._id === user.userId ? 'primary.main' : 'text.primary',
                }}
              >
                {msg.text}
              </Typography>
            </Box>
            {idx < messages.length - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', my: 1 }} />}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isSessionLoading}
            autoComplete="off"
          />
          <IconButton
            type="submit"
            color="primary"
            disabled={isLoading || isSessionLoading || !input.trim()}
            sx={{ ml: 1, p: '10px' }}
            aria-label="send message"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatRoom;