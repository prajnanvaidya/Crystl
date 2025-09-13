import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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
import { CheckCircleOutline, ErrorOutline, ContentCopy, Assessment, PendingActions } from '@mui/icons-material';

// --- Re-usable Chart Components ---
// These are assumed to be in the specified paths and are fully functional.
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// ==================================================================================
// ==                         MAIN DASHBOARD COMPONENT                             ==
// ==================================================================================
const DepartmentDashboard = () => {
  // --- STATE MANAGEMENT ---
  const { user } = useAuth(); // Logged-in department's details from AuthContext.
  const [currentTab, setCurrentTab] = useState(0); // 0 for Approvals, 1 for Analytics.

  // --- State for the "Approvals" Tab ---
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isApprovalsLoading, setIsApprovalsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null); // Holds the ID of the transaction being updated.

  // --- State for the "Analytics" Tab ---
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [trendGroupBy, setTrendGroupBy] = useState('monthly'); // Filter state for the trend chart.

  // --- General Feedback State ---
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- DATA FETCHING ---
  // Fetch pending transactions on initial component load.
  useEffect(() => {
    const fetchPendingTransactions = async () => {
      setIsApprovalsLoading(true);
      try {
        const { data } = await api.get('/department/pending-transactions');
        setPendingTransactions(data.transactions);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch pending approvals.');
      } finally {
        setIsApprovalsLoading(false);
      }
    };
    fetchPendingTransactions();
  }, []); // Empty dependency array ensures this runs only once.

  // Fetch analytics data when the user switches to the analytics tab or changes the trend filter.
  useEffect(() => {
    const fetchAnalytics = async () => {
      // Proceed only if the analytics tab is active and the department is linked.
      if (currentTab === 1 && user?.linkedInstitution) {
        setIsAnalyticsLoading(true);
        setError('');
        try {
          const institutionId = user.linkedInstitution;
          // Fetch all analytics data concurrently for performance.
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
          setError('Could not load institution analytics.');
        } finally {
          setIsAnalyticsLoading(false);
        }
      }
    };
    fetchAnalytics();
  }, [currentTab, user, trendGroupBy]); // Re-run this effect if any of these values change.

  // --- HANDLERS ---
  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

  const handleVerifyTransaction = async (transactionId, newStatus) => {
    setActionInProgress(transactionId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/department/verify-transaction/${transactionId}`, { status: newStatus });
      setSuccess(`Transaction successfully marked as ${newStatus}.`);
      // Update UI immediately for a better user experience.
      setPendingTransactions(prev => prev.filter(t => t._id !== transactionId));
    } catch (err) {
      setError(err.response?.data?.msg || `Failed to update transaction.`);
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

  // --- RENDER LOGIC ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Department Dashboard</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{user?.name}</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ bgcolor: '#1E1E1E', p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab icon={<PendingActions />} iconPosition="start" label="Pending Approvals" />
            <Tab icon={<Assessment />} iconPosition="start" label="Institution Analytics" disabled={!user?.linkedInstitution} />
          </Tabs>
        </Box>

        {/* --- Approvals Tab Panel --- */}
        {currentTab === 0 && (
          <Box sx={{ pt: 3 }}>
            {isApprovalsLoading ? <CircularProgress /> : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {pendingTransactions.length > 0 ? (
                    <List sx={{ p: 0 }}>
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
                    <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CheckCircleOutline color="success" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h6">All Clear!</Typography>
                      <Typography color="text.secondary">You have no pending transactions to review.</Typography>
                    </Paper>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
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

        {/* --- Analytics Tab Panel --- */}
        {currentTab === 1 && (
          <Box sx={{ pt: 3 }}>
            {isAnalyticsLoading ? <CircularProgress /> : analyticsData ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom>Fund Flow</Typography>
                    <SankeyChart data={analyticsData.flowchart} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom>Spending by Department</Typography>
                    <DepartmentPieChart data={analyticsData.departmentShare} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom>Spending Trend</Typography>
                    <SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} />
                  </Paper>
                </Grid>
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