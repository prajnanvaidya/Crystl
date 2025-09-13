// src/pages/ChatbotPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatPage = () => {
  const { institutionId } = useParams(); // Get the institution ID from the URL

  // A single state object to hold the session, which includes the messages
  const [session, setSession] = useState(null);
  
  // UI States
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For when the AI is "thinking"
  const [isSessionLoading, setIsSessionLoading] = useState(true); // For the initial page load
  const [error, setError] = useState('');
  
  // Ref to an empty div at the end of the message list to enable auto-scrolling
  const messagesEndRef = useRef(null);

  // Helper function to scroll to the bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // This is the single, reliable function to get the session and update all state.
  // Using useCallback prevents it from being recreated on every render.
  const fetchSession = useCallback(async () => {
    if (!institutionId) {
      setError('No institution ID provided.');
      setIsSessionLoading(false);
      return;
    }
    try {
      // Call the backend to find an existing session or create a new one
      const { data } = await api.post('/chatbot/session', { institutionId });
      setSession(data.session); // Set the entire session object (including messages) in state
    } catch (err) {
      setError('Failed to initialize or load chat session.');
      console.error("Failed to create/get chat session:", err);
    } finally {
      setIsSessionLoading(false);
    }
  }, [institutionId]);

  // Effect to fetch the session when the page first loads
  useEffect(() => {
    setIsSessionLoading(true);
    fetchSession();
  }, [fetchSession]);

  // Effect to auto-scroll every time the messages array changes
  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  // Handler for sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !session?._id || isLoading) return;

    const newQuestion = input;
    
    // Optimistically update the UI so the user sees their message immediately.
    setSession(prevSession => ({
      ...prevSession,
      messages: [...prevSession.messages, { role: 'user', text: newQuestion, _id: `temp-${Date.now()}` }]
    }));
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Send the message to the backend. The backend will save both the user's
      // question and the AI's response to the database.
      await api.post(`/chatbot/session/${session._id}/message`, {
        question: newQuestion,
      });

      // Instead of manually adding the AI response, we re-fetch the entire session.
      // This re-syncs our frontend with the database's "source of truth", guaranteeing
      // that the chat history is always 100% accurate.
      await fetchSession();

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Sorry, an error occurred while fetching the response. Please try again.');
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
      }}
    >
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        AI Financial Assistant
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {session?.messages?.length === 0 && !isLoading && (
          <Typography color="text.secondary" textAlign="center">
            Ask a question about this institution's finances to get started.
          </Typography>
        )}
        {session?.messages?.map((msg) => (
          <Box
            key={msg._id} // Using the real _id from the database
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                backgroundColor: msg.role === 'user' ? 'primary.main' : 'background.default',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                maxWidth: '75%',
                borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                wordWrap: 'break-word',
              }}
            >
              <Typography variant="body1">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about transactions, vendors, or spending trends..."
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

export default ChatPage;