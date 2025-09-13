// src/pages/DepartmentDashboard.jsx - CORRECTED AND TRULY COMPLETE VERSION

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import {
  Container, Typography, Grid, Paper, Box, Alert, CircularProgress,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon, Card, CardContent, CardActions,
  Chip, Tooltip, Button, Divider, Tabs, Tab, Modal, TextField
} from '@mui/material';
import { 
  CheckCircleOutline, ReportProblem, ContentCopy, Assessment, PendingActions, Description, 
  Business as BusinessIcon, UploadFile as UploadFileIcon, Add as AddIcon 
} from '@mui/icons-material';

// --- Chart Component Imports ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// --- STYLES FOR THE MODAL ---
const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: '#1E1E1E', color: 'white', border: '1px solid #444',
  borderRadius: 2, boxShadow: 24, p: 4,
};

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  
  // State for Approvals Tab
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true); // Single loading state for initial data
  const [actionInProgress, setActionInProgress] = useState(null);
  const [linkedDepartments, setLinkedDepartments] = useState([]);

  // State for Analytics Tab
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  
  // --- NEW: State for upload modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // General UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsDataLoading(true);
      setError('');
      try {
        const promises = [api.get('/department/pending-transactions')];
        if (user?.linkedInstitution) {
          promises.push(api.get(`/public/institution/${user.linkedInstitution}/departments`));
        }
        const responses = await Promise.all(promises);
        setPendingTransactions(responses[0].data.transactions);
        if (responses[1]) {
          setLinkedDepartments(responses[1].data.departments.filter(d => d.name !== user.name));
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch initial dashboard data.'));
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchReports = async () => {
      if (currentTab === 2 && user?.linkedInstitution && reports.length === 0) { // Tab index is now 2
        setIsAnalyticsLoading(true);
        try {
          const { data } = await api.get(`/public/institution/${user.linkedInstitution}/reports`);
          setReports(data.reports);
        } catch (err) {
          setError(getErrorMessage(err, 'Could not load institution reports.'));
        } finally {
          setIsAnalyticsLoading(false);
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
  
  // --- NEW: Handler for uploading a spending report ---
  const handleUploadSpendingReport = async (e) => {
    e.preventDefault();
    if (!selectedFile || !newReportName) {
      setError('Please provide a report name and select a file.');
      return;
    }
    setError(''); setSuccess('');
    const formData = new FormData();
    formData.append('reportName', newReportName);
    formData.append('spendingFile', selectedFile);

    try {
      const { data } = await api.post('/department/upload-spending', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(data.msg);
      setIsModalOpen(false);
      setNewReportName('');
      setSelectedFile(null);
    } catch (err) {
      setError(getErrorMessage(err, 'File upload failed.'));
    }
  };

  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setIsAnalyticsLoading(true);
    setError('');
    try {
      const institutionId = user.linkedInstitution;
      const [flowchartRes, deptShareRes, trendRes] = await Promise.all([
        api.get(`/public/flowchart/${institutionId}`),
        api.get(`/public/analytics/${institutionId}/department-share`),
        api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`)
      ]);
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
            <Tab icon={<UploadFileIcon />} iconPosition="start" label="Log Spending" disabled={!user?.linkedInstitution} />
            <Tab icon={<Assessment />} iconPosition="start" label="Institution Analytics" disabled={!user?.linkedInstitution} />
          </Tabs>
        </Box>

        {/* --- PENDING APPROVALS TAB (RESTORED) --- */}
        {currentTab === 0 && (
          <Box sx={{ pt: 3 }}>
            {isDataLoading ? <CircularProgress /> : (
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
                              )) : ( <ListItem><ListItemText primary="No other linked departments found." /></ListItem> )}
                          </List>
                      </Paper>
                   </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* --- LOG SPENDING TAB (NEW) --- */}
        {currentTab === 1 && (
          <Box sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Your Department's Spending Reports</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}>
                Upload New Spending Report
              </Button>
            </Box>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center', minHeight: '50vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Typography color="text.secondary">
                A list of your department's logged expenses will appear here once you upload reports.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* --- INSTITUTION ANALYTICS TAB (RESTORED) --- */}
        {currentTab === 2 && (
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Institution Reports</Typography>
                  {isAnalyticsLoading ? <CircularProgress /> : (
                    <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
                      {reports.length > 0 ? reports.map(report => (
                        <ListItem key={report._id} disablePadding>
                          <ListItemButton selected={selectedReport?._id === report._id} onClick={() => handleSelectReport(report)} sx={{ borderRadius: 1 }}>
                            <ListItemIcon><Description sx={{ color: 'text.secondary' }} /></ListItemIcon>
                            <ListItemText primary={report.name} secondary={`Date: ${new Date(report.reportDate).toLocaleDateString()}`} />
                          </ListItemButton>
                        </ListItem>
                      )) : ( <ListItem><ListItemText primary="No reports found for the linked institution." /></ListItem> )}
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>
                  ) : analyticsData ? (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Fund Flow</Typography><SankeyChart data={analyticsData.flowchart} /></Paper></Grid>
                      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Spending by Department</Typography><DepartmentPieChart data={analyticsData.departmentShare} /></Paper></Grid>
                      <Grid item xs={12} md={6}><Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)' }}><Typography variant="h6" gutterBottom>Spending Trend</Typography><SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} /></Paper></Grid>
                    </Grid>
                  ) : ( <Typography>Could not load analytics data.</Typography> )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* --- MODAL FOR NEW SPENDING REPORT (NEW) --- */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle} component="form" onSubmit={handleUploadSpendingReport}>
          <Typography variant="h6" component="h2">Upload Department Spending</Typography>
          <TextField 
            label="Report Name" 
            value={newReportName} 
            onChange={e => setNewReportName(e.target.value)} 
            fullWidth 
            margin="normal" 
            required 
          />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2, mb: 1 }}>
            Select Spending File (CSV or PDF)
            <input type="file" hidden onChange={e => setSelectedFile(e.target.files[0])} accept=".csv,.pdf" />
          </Button>
          {selectedFile && <Typography sx={{ textAlign: 'center', mb: 2 }}>{selectedFile.name}</Typography>}
          <Button type="submit" variant="contained" fullWidth>Submit Report</Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default DepartmentDashboard;