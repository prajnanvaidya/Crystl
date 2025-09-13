// src/pages/DepartmentDashboard.jsx - FINAL COMPLETE VERSION

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import {
  Container, Typography, Grid, Paper, Box, Alert, CircularProgress,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon, Card, CardContent, CardActions,
  Chip, Tooltip, Button, Divider, Tabs, Tab
} from '@mui/material';
import { 
  CheckCircleOutline, ReportProblem, ContentCopy, Assessment, PendingActions, Description, 
  Business as BusinessIcon 
} from '@mui/icons-material';

// --- Chart Component Imports ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  
  // State for Approvals Tab
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isApprovalsLoading, setIsApprovalsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [linkedDepartments, setLinkedDepartments] = useState([]);

  // State for Analytics Tab
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  
  // General UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- DATA FETCHING ---

  // 1. Fetch initial dashboard data (approvals AND peer departments)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsApprovalsLoading(true);
      setError('');
      try {
        const transactionsPromise = api.get('/department/pending-transactions');
        
        const promisesToRun = [transactionsPromise];
        
        if (user?.linkedInstitution) {
          promisesToRun.push(api.get(`/public/institution/${user.linkedInstitution}/departments`));
        }

        const responses = await Promise.all(promisesToRun);

        setPendingTransactions(responses[0].data.transactions);
        
        if (responses[1]) {
          const peerDepartments = responses[1].data.departments.filter(dept => dept.name !== user.name);
          setLinkedDepartments(peerDepartments);
        }

      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch initial dashboard data.'));
      } finally {
        setIsApprovalsLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // 2. Fetch the list of reports when the user switches to the analytics tab
  useEffect(() => {
    const fetchReports = async () => {
      if (currentTab === 1 && user?.linkedInstitution && reports.length === 0) {
        setIsReportsLoading(true);
        setError('');
        try {
          const { data } = await api.get(`/public/institution/${user.linkedInstitution}/reports`);
          setReports(data.reports);
        } catch (err) {
          setError(getErrorMessage(err, 'Could not load institution reports.'));
        } finally {
          setIsReportsLoading(false);
        }
      }
    };
    fetchReports();
  }, [currentTab, user, reports.length]);

  // --- HANDLERS ---
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSelectedReport(null);
    setAnalyticsData(null);
  };
  
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
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
      setError(getErrorMessage(err, 'Could not load analytics for the selected report.'));
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleVerifyTransaction = async (transactionId, newStatus) => {
    setActionInProgress(transactionId);
    setError(''); setSuccess('');
    try {
      await api.patch(`/department/verify-transaction/${transactionId}`, { status: newStatus });
      setSuccess(`Transaction successfully marked as ${newStatus}.`);
      setPendingTransactions(prev => prev.filter(t => t._id !== transactionId));
    } catch (err) {
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
    if (newGroupBy !== null) setTrendGroupBy(newGroupBy);
  };

  // --- RENDER LOGIC ---
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Department Dashboard</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{user?.name}</Typography>

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ bgcolor: '#1E1E1E', p: { xs: 1, sm: 2 } }}>
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
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Paper sx={{ p: 2.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                          <Typography variant="subtitle1" gutterBottom>Your Department ID</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Tooltip title="Copy to Clipboard">
                            <Chip icon={<ContentCopy />} label={user?.departmentId || 'Not available'} onClick={handleCopyToClipboard} sx={{ width: '100%', justifyContent: 'flex-start', mt: 1, p: 2.5, fontSize: '1rem', '&:hover': { bgcolor: 'primary.main', cursor: 'pointer' } }}/>
                          </Tooltip>
                      </Paper>

                      <Paper sx={{ p: 2.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                          <Typography variant="h6" gutterBottom>Peer Departments</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                              {linkedDepartments.length > 0 ? linkedDepartments.map(dept => (
                                  <ListItem key={dept._id}>
                                      <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                                      <ListItemText primary={dept.name} />
                                  </ListItem>
                              )) : (
                                  <ListItem>
                                      <ListItemText primary="No other linked departments found." />
                                  </ListItem>
                              )}
                          </List>
                      </Paper>
                   </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Institution Reports</Typography>
                  {isReportsLoading ? <CircularProgress /> : (
                    <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
                      {reports.length > 0 ? reports.map(report => (
                        <ListItem key={report._id} disablePadding>
                          <ListItemButton 
                            selected={selectedReport?._id === report._id} 
                            onClick={() => handleSelectReport(report)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon><Description sx={{ color: 'text.secondary' }} /></ListItemIcon>
                            <ListItemText 
                              primary={report.name} 
                              secondary={`Date: ${new Date(report.reportDate).toLocaleDateString()}`} 
                            />
                          </ListItemButton>
                        </ListItem>
                      )) : (
                        <ListItem><ListItemText primary="No reports found for the linked institution." /></ListItem>
                      )}
                    </List>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', minHeight: 600 }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}
                  </Typography>
                  
                  {!selectedReport ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, flexDirection: 'column', color: 'text.secondary' }}>
                      <Typography variant="h6">Select a report from the list on the left</Typography>
                      <Typography>View detailed analytics and visualizations.</Typography>
                    </Box>
                  ) : isAnalyticsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                      <CircularProgress />
                    </Box>
                  ) : analyticsData ? (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Fund Flow</Typography><SankeyChart data={analyticsData.flowchart} /></Paper></Grid>
                      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Spending by Department</Typography><DepartmentPieChart data={analyticsData.departmentShare} /></Paper></Grid>
                      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Spending Trend</Typography><SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} /></Paper></Grid>
                    </Grid>
                  ) : (
                     <Typography>Could not load analytics data.</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DepartmentDashboard;