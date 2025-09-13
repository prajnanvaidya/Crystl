// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

const LoginPage = () => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role is 'user'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- HOOKS ---
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- HANDLERS ---
  const handleRoleChange = (event, newRole) => {
    // Prevents unselecting all options. At least one must be selected.
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError(''); // Clear previous errors
    setIsLoading(true);

    try {
      // Call the login function from our AuthContext
      await login(role, { email, password });
      // On success, the user state in AuthContext will update,
      // and the routing in App.jsx will automatically redirect to the dashboard.
      navigate('/dashboard');
    } catch (err) {
      // If the API call throws an error, we catch it here
      const errorMessage = err.response?.data?.msg || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Stop the loading indicator
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>

        {/* --- ROLE SELECTOR --- */}
        <ToggleButtonGroup
          color="primary"
          value={role}
          exclusive
          onChange={handleRoleChange}
          aria-label="User role"
          sx={{ mt: 3, mb: 2 }}
        >
          <ToggleButton value="user">Public User</ToggleButton>
          <ToggleButton value="department">Department</ToggleButton>
          <ToggleButton value="institution">Institution</ToggleButton>
        </ToggleButtonGroup>

        {/* --- LOGIN FORM --- */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* --- ERROR DISPLAY --- */}
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* --- SUBMIT BUTTON --- */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Typography variant="body2" align="center">
            Don't have an account?{' '}
            <RouterLink to="/register" style={{ color: 'inherit' }}>
              Sign Up
            </RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;