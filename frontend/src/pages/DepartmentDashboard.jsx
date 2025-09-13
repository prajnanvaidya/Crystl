// src/pages/DepartmentDashboard.jsx - FULLY UPDATED AND COMPLETE

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler'; // <-- CHANGE #1: Import the helper
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  Button,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
// CHANGE #2: Imported ReportProblem icon for better error display
import { CheckCircleOutline, ReportProblem, ContentCopy, Assessment, PendingActions } from '@mui/icons-material';

// --- (All chart components are assumed to be correctly imported) ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

const DepartmentDashboard = () => {
  // --- (All state management remains exactly the same) ---
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isApprovalsLoading, setIsApprovalsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- DATA FETCHING (with updated catch blocks) ---
  useEffect(() => {
    const fetchPendingTransactions = async () => {
      setIsApprovalsLoading(true);
      setError(''); // Clear previous errors
      try {
        const { data } = await api.get('/department/pending-transactions');
        setPendingTransactions(data.transactions);
      } catch (err) {
        // CHANGE #3: Use the helper for a more specific error message
        setError(getErrorMessage(err, 'Failed to fetch pending approvals.'));
      } finally {
        setIsApprovalsLoading(false);
      }
    };
    fetchPendingTransactions();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (currentTab === 1 && user?.linkedInstitution) {
        setIsAnalyticsLoading(true);
        setError('');
        try {
          const institutionId = user.linkedInstitution;
          const flowchartPromise = api.get(`/public/flowchart/${institutionId}`);
          const deptSharePromise = api.get(`/public/analytics/${institutionId}/department-share`);
          const spendingTrendPromise = api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`);
          const [flowchartRes, deptShareRes, trendRes] = await Promise.all([flowchartPromise, deptSharePromise, spendingTrendPromise]);
          setAnalyticsData({
            flowchart: flowchartRes.data,
            departmentShare: deptShareRes.data.departmentShares,
            spendingTrend: trendRes.data.spendingTrend,
          });
        } catch (err) {
          // CHANGE #4: Use the helper for a more specific error message
          setError(getErrorMessage(err, 'Could not load institution analytics.'));
        } finally {
          setIsAnalyticsLoading(false);
        }
      }
    };
    fetchAnalytics();
  }, [currentTab, user, trendGroupBy]);

  // --- HANDLERS (with updated catch blocks) ---
  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

  const handleVerifyTransaction = async (transactionId, newStatus) => {
    setActionInProgress(transactionId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/department/verify-transaction/${transactionId}`, { status: newStatus });
      setSuccess(`Transaction successfully marked as ${newStatus}.`);
      setPendingTransactions(prev => prev.filter(t => t._id !== transactionId));
    } catch (err) {
      // CHANGE #5: Use the helper for a more specific error message
      setError(getErrorMessage(err, 'Failed to update transaction.'));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCopyToClipboard = () => {
    if (user?.departmentId) {
      navigator.clipboard.writeText(user.departmentId);
      setSuccess('Department ID copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };
  
  const handleTrendFilterChange = (event, newGroupBy) => {
    if (newGroupBy !== null) {
      setTrendGroupBy(newGroupBy);
    }
  };

  // --- RENDER LOGIC (with updated feedback displays) ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Department Dashboard</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{user?.name}</Typography>

      {/* CHANGE #6: Added dismissible functionality to the alerts for better UX */}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ bgcolor: '#1E1E1E', p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab icon={<PendingActions />} iconPosition="start" label="Pending Approvals" />
            <Tab icon={<Assessment />} iconPosition="start" label="Institution Analytics" disabled={!user?.linkedInstitution} />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <Box sx={{ pt: 3 }}>
            {isApprovalsLoading ? <CircularProgress /> : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {pendingTransactions.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {/* (This mapping logic remains unchanged) */}
                      {pendingTransactions.map((transaction) => (
                        <ListItem key={transaction._id} sx={{ px: 0, py: 1 }}>
                          <Card variant="outlined" sx={{ width: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">{transaction.description}</Typography>
                                <Typography variant="h6" color="primary.light">${transaction.amount.toLocaleString()}</Typography>
                              </Box>
                              <Typography color="text.secondary">From: <strong>{transaction.institution.name}</strong></Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'rgba(0, 0, 0, 0.1)' }}>
                              <Button size="small" color="error" variant="outlined" disabled={!!actionInProgress} onClick={() => handleVerifyTransaction(transaction._id, 'disputed')}>Dispute</Button>
                              <Button size="small" color="success" variant="contained" disabled={!!actionInProgress} onClick={() => handleVerifyTransaction(transaction._id, 'completed')}>
                                {actionInProgress === transaction._id ? <CircularProgress size={20} color="inherit"/> : 'Approve'}
                              </Button>
                            </CardActions>
                          </Card>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    // CHANGE #7: Added logic to show a styled error here if loading fails, otherwise show the "All Clear" message.
                    error ? (
                        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255, 82, 82, 0.1)', color: 'error.light' }}>
                            <ReportProblem color="error" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6">Could Not Load Approvals</Typography>
                            <Typography>{error}</Typography>
                        </Paper>
                    ) : (
                        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                            <CheckCircleOutline color="success" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6">All Clear!</Typography>
                            <Typography color="text.secondary">You have no pending transactions to review.</Typography>
                        </Paper>
                    )
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                   {/* (This part remains unchanged) */}
                   <Paper sx={{ p: 2.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Typography variant="subtitle1" gutterBottom>Your Department ID</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Tooltip title="Copy to Clipboard">
                        <Chip icon={<ContentCopy />} label={user?.departmentId || 'Not available'} onClick={handleCopyToClipboard} sx={{ width: '100%', justifyContent: 'flex-start', mt: 1, p: 2.5, fontSize: '1rem', '&:hover': { bgcolor: 'primary.main', cursor: 'pointer' } }}/>
                      </Tooltip>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ pt: 3 }}>
            {/* (This analytics tab logic remains unchanged) */}
            {isAnalyticsLoading ? <CircularProgress /> : analyticsData ? (
              <Grid container spacing={3}>
                <Grid item xs={12}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}><Typography variant="h6" gutterBottom>Fund Flow</Typography><SankeyChart data={analyticsData.flowchart} /></Paper></Grid>
                <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}><Typography variant="h6" gutterBottom>Spending by Department</Typography><DepartmentPieChart data={analyticsData.departmentShare} /></Paper></Grid>
                <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}><Typography variant="h6" gutterBottom>Spending Trend</Typography><SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} /></Paper></Grid>
              </Grid>
            ) : (
              <Typography>No analytics to display. Make sure you are linked to an institution.</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DepartmentDashboard;