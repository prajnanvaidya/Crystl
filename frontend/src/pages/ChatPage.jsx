// src/pages/dashboard/ChatPage.jsx 
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // <-- Import hook to read URL params
import api from '../services/api';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
// ChatWindow UI can be a separate component or stay here
// For simplicity, we'll keep it here for now.

const ChatPage = () => {
  const { institutionId } = useParams(); // <-- Get the ID from the URL
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      if (!institutionId) return;
      try {
        const response = await api.post('/chatbot/session', { institutionId });
        setSessionId(response.data.session._id);
        // You can also load previous messages here if the session already existed
        // setMessages(response.data.session.messages);
      } catch (error) {
        console.error("Failed to create/get chat session:", error);
      } finally {
        setIsSessionLoading(false);
      }
    };
    getSession();
  }, [institutionId]);

  const handleSendMessage = async (e) => {
    // ... (This logic remains the same as your ChatWindow component)
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
        const response = await api.post(`/chatbot/session/${sessionId}/message`, { question: input });
        const modelMessage = { role: 'model', text: response.data.answer };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => [...prev, { role: 'model', text: 'Error fetching response.' }]);
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
        height: 'calc(100vh - 120px)', // Adjust height as needed
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 800,
        margin: 'auto',
      }}
    >
      {/* Message Display Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {messages.length === 0 && (
            <Typography color="text.secondary" textAlign="center">
                Ask a question about this institution's finances to get started.
            </Typography>
        )}
        {messages.map((msg, index) => (
          <Box
            key={index}
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
                maxWidth: '70%',
                borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
              }}
            >
              {/* We can add markdown support here later for better formatting */}
              <Typography variant="body1">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
         {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />}
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about transactions, vendors, or departments..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ ml: 1, p: '14px' }}
            aria-label="send message"
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatPage;