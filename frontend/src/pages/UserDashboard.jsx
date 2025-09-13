// src/pages/dashboard/UserDashboard.jsx

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Box, Typography, Paper, Grid, CircularProgress, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// A simple card component to display each institution
const InstitutionCard = ({ institution }) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                }
            }}
        >
            <Box>
                <Typography variant="h6" component="h3" gutterBottom>
                    {institution.name}
                </Typography>
                {/* We can add more details here later, like total budget, etc. */}
            </Box>
            <Button
                variant="outlined"
                sx={{ mt: 2 }}
                component={RouterLink}
                to={`/dashboard/user/chat/${institution._id}`} // Link to start a chat
            >
                Ask AI Assistant
            </Button>
        </Paper>
    );
};

const UserDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In the future, this will be a real API call to get all institutions.
    // For now, we'll use the same mock data.
    const fetchInstitutions = async () => {
      try {
        const response = await api.get('/public/institutions');
        if (response.data && Array.isArray(response.data.institutions)) {
            setInstitutions(response.data.institutions);
        } else {
            // This case handles if the backend sends an empty or unexpected response.
            setInstitutions([]);
            console.warn('Backend response did not contain an institutions array:', response.data);
        }
      } catch (err) {
        setError('Failed to load institutions from the server.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Public Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Explore and interact with public financial data from linked institutions.
      </Typography>

      <Grid container spacing={3}>
        {institutions.map((inst) => (
          <Grid item key={inst._id} xs={12} sm={6} md={4}>
            <InstitutionCard institution={inst} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserDashboard;