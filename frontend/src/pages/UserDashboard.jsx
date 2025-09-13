// src/pages/UserDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  TextField,
  Tabs,
  Tab,
  Paper,
  Alert,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';

// --- Reusable Institution Card Component ---
// This card displays a single institution and its available actions.
const InstitutionCard = ({ institution, isFollowed, onFollow, onUnfollow }) => {
  // This handler prevents the main card link from being triggered when a button is clicked.
  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, cursor: 'pointer' },
      }}
    >
      {/* Top section with the institution's name */}
      <Box>
        <Typography variant="h6" gutterBottom>{institution.name}</Typography>
      </Box>
      
      {/* Bottom section with action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        {isFollowed ? (
          <Tooltip title="Stop receiving updates for this institution">
            <Button
              variant="contained"
              color="error"
              startIcon={<BookmarkRemoveIcon />}
              onClick={(e) => handleButtonClick(e, () => onUnfollow(institution._id))}
            >
              Unfollow
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Add this institution to your personal dashboard">
            <Button
              variant="contained"
              color="primary"
              startIcon={<BookmarkAddIcon />}
              onClick={(e) => handleButtonClick(e, () => onFollow(institution._id))}
            >
              Follow
            </Button>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};


// --- Main User Dashboard Component ---
const UserDashboard = () => {
  // State for storing data from the API
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [followedInstitutions, setFollowedInstitutions] = useState([]);
  
  // State for controlling the UI
  const [displayedInstitutions, setDisplayedInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 for 'All', 1 for 'Followed'

  // Fetches the user's personal list of followed institutions.
  // useCallback is used for performance optimization.
  const fetchFollowed = useCallback(async () => {
    try {
      const { data } = await api.get('/user/dashboard');
      setFollowedInstitutions(data.followedInstitutions);
    } catch (err) {
      setError('Could not fetch your followed institutions.');
    }
  }, []);

  // This effect runs once on page load to get all the necessary data.
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // We fetch the list of ALL institutions and the user's FOLLOWED institutions
        // at the same time for a faster page load.
        const allInstPromise = api.get('/public/institutions');
        const followedInstPromise = fetchFollowed();
        
        const [allInstResponse] = await Promise.all([allInstPromise, followedInstPromise]);
        
        setAllInstitutions(allInstResponse.data.institutions);
      } catch (err) {
        setError('Failed to load institution data from the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [fetchFollowed]);

  // This effect is responsible for filtering and updating the visible list of institutions
  // whenever the user types in the search bar or switches tabs.
  useEffect(() => {
    let listToDisplay = activeTab === 0 ? allInstitutions : followedInstitutions;
    
    if (searchTerm) {
      listToDisplay = listToDisplay.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setDisplayedInstitutions(listToDisplay);
  }, [activeTab, allInstitutions, followedInstitutions, searchTerm]);


  // --- Event Handlers ---
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFollow = async (institutionId) => {
    try {
      await api.post(`/user/follow/${institutionId}`);
      await fetchFollowed(); // Re-fetch the followed list to instantly update the UI
    } catch (err) {
      setError('Failed to follow institution.');
    }
  };

  const handleUnfollow = async (institutionId) => {
    try {
      await api.post(`/user/unfollow/${institutionId}`);
      await fetchFollowed(); // Re-fetch the followed list to update the UI
    } catch (err) {
      setError('Failed to unfollow institution.');
    }
  };


  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Explorer Dashboard
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* --- Search and Filter Controls --- */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search Institutions..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="All Institutions" />
              <Tab label="Followed" />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* --- Institutions Grid --- */}
      <Grid container spacing={3}>
        {displayedInstitutions.length > 0 ? (
          displayedInstitutions.map((inst) => {
            // Check if the current institution is in the user's followed list
            const isFollowed = followedInstitutions.some(followedInst => followedInst._id === inst._id);
            return (
              // Wrap the entire Grid item in a link to the public detail page
              <Grid item key={inst._id} xs={12} sm={6} md={4}
                component={RouterLink}
                to={`/institution/${inst._id}`}
                sx={{ textDecoration: 'none' }}
              >
                <InstitutionCard
                  institution={inst}
                  isFollowed={isFollowed}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ p: 4, textAlign: 'center' }}>
              No institutions found.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UserDashboard;