import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';

const InstitutionExplorerPage = () => {
  const [institutions, setInstitutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoading(true);
      try {
        // This public endpoint supports a search query
        const { data } = await api.get(`/public/institutions?search=${searchTerm}`);
        setInstitutions(data.institutions);
      } catch (err) {
        setError('Could not fetch institutions.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Use a timeout to prevent API calls on every keystroke (debouncing)
    const delayDebounceFn = setTimeout(() => {
      fetchInstitutions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Explore Institutions
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Select an institution to view its public financial data and spending analysis.
        </Typography>
        <TextField
          fullWidth
          label="Search by name..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box sx={{ mt: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {institutions.length > 0 ? institutions.map((inst) => (
                <ListItem key={inst._id} disablePadding>
                  {/* Each item links to the public detail page for that institution */}
                  <ListItemButton component={Link} to={`/institution/${inst._id}`}>
                    <ListItemText primary={inst.name} />
                  </ListItemButton>
                </ListItem>
              )) : (
                <Typography>No institutions found.</Typography>
              )}
            </List>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default InstitutionExplorerPage;