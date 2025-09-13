import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Container, Typography, Grid, Paper, TextField, Button, Box, Alert,
  CircularProgress, List, ListItem, ListItemText, ListItemButton, Divider,
  Modal, Select, MenuItem, InputLabel, FormControl, Dialog, AppBar,
  Toolbar, IconButton, Tooltip
} from '@mui/material';
import {
  BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp,
  Fullscreen as FullscreenIcon, Close as CloseIcon
} from '@mui/icons-material';

// --- Import Chart Components ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// --- STYLES FOR THE MODAL ---
const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: '#1E1E1E', color: 'white', border: '1px solid #444',
  borderRadius: 2, boxShadow: 24, p: 4,
};

// ==================================================================================
// ==                         MAIN DASHBOARD COMPONENT                             ==
// ==================================================================================
const InstitutionDashboard = () => {
  // --- STATE MANAGEMENT ---
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkedDepartments, setLinkedDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({ flowchart: null, departmentShare: null, spendingTrend: null });
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [departmentIdToLink, setDepartmentIdToLink] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportType, setNewReportType] = useState('monthly');
  const [newReportDate, setNewReportDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fullscreenContent, setFullscreenContent] = useState({ open: false, title: '', ChartComponent: null });

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const departmentsPromise = api.get('/institution/linked-departments');
        const reportsPromise = api.get('/institution/reports');
        const [departmentsRes, reportsRes] = await Promise.all([departmentsPromise, reportsPromise]);
        setLinkedDepartments(departmentsRes.data.departments);
        setReports(reportsRes.data.reports);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load initial dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- HANDLERS ---
  const handleLinkDepartment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/institution/link-department', { departmentId: departmentIdToLink });
      setSuccess(data.msg);
      const response = await api.get('/institution/linked-departments');
      setLinkedDepartments(response.data.departments);
      setDepartmentIdToLink('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to link department.');
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!selectedFile || !newReportName || !newReportDate) {
      setError('Please fill in all report details and select a file.');
      return;
    }
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('name', newReportName);
    formData.append('type', newReportType);
    formData.append('reportDate', newReportDate);
    formData.append('transactionsFile', selectedFile);
    try {
      const { data } = await api.post('/institution/upload-transactions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(data.msg);
      const response = await api.get('/institution/reports');
      setReports(response.data.reports);
      setIsModalOpen(false);
      setNewReportName('');
      setNewReportDate('');
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'File upload failed.');
    }
  };

  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setIsAnalyticsLoading(true);
    setError('');
    try {
      const institutionId = user.userId;
      const flowchartPromise = api.get(`/public/flowchart/${institutionId}`);
      const deptSharePromise = api.get(`/public/analytics/${institutionId}/department-share`);
      const spendingTrendPromise = api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`);
      const [flowchartRes, deptShareRes, spendingTrendRes] = await Promise.all([flowchartPromise, deptSharePromise, spendingTrendPromise]);
      setAnalyticsData({
        flowchart: flowchartRes.data,
        departmentShare: deptShareRes.data.departmentShares,
        spendingTrend: spendingTrendRes.data.spendingTrend,
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Could not load analytics.");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleTrendFilterChange = async (event, newGroupBy) => {
    if (newGroupBy !== null) {
      setTrendGroupBy(newGroupBy);
      setIsAnalyticsLoading(true);
      try {
        const { data } = await api.get(`/public/analytics/${user.userId}/spending-trend?groupBy=${newGroupBy}`);
        setAnalyticsData(prevData => ({ ...prevData, spendingTrend: data.spendingTrend }));
      } catch (err) {
        setError("Failed to update spending trend data.");
      } finally {
        setIsAnalyticsLoading(false);
      }
    }
  };

  const handleOpenFullscreen = (title, ChartComponent) => {
    setFullscreenContent({ open: true, title, ChartComponent });
  };

  const handleCloseFullscreen = () => {
    setFullscreenContent({ open: false, title: '', ChartComponent: null });
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: 2, width: '100%' }}>
      {/* The "Welcome" message was removed from the image, but can be added back here if needed */}
      {/* <Typography variant="h4" gutterBottom>Welcome, {user?.name}</Typography> */}
      
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={4}>
          {/* Management & Link Department */}
          <Paper sx={{ p: 2, bgcolor: '#1E1E1E', mb: 3 }}>
            <Typography variant="h6" gutterBottom>Management</Typography>
            <Button variant="contained" fullWidth onClick={() => setIsModalOpen(true)} sx={{ mb: 2 }}>
              Create New Report
            </Button>
            <Divider sx={{ my: 2 }} />
            <Box component="form" onSubmit={handleLinkDepartment}>
              <Typography variant="subtitle1" gutterBottom>Link a Department</Typography>
              <TextField 
                label="Department ID" 
                value={departmentIdToLink} 
                onChange={e => setDepartmentIdToLink(e.target.value)} 
                fullWidth 
                margin="dense" 
                required 
                size="small"
              />
              <Button type="submit" variant="outlined" fullWidth sx={{ mt: 1 }}>
                Link Department
              </Button>
            </Box>
          </Paper>
          {/* Submitted Reports */}
          <Paper sx={{ p: 2, bgcolor: '#1E1E1E', mb: 3 }}>
            <Typography variant="h6" gutterBottom>Submitted Reports</Typography>
            <List dense sx={{ maxHeight: 180, overflow: 'auto' }}>
              {reports.length > 0 ? 
                reports.map(report => (
                  <ListItem key={report._id} disablePadding>
                    <ListItemButton 
                      selected={selectedReport?._id === report._id} 
                      onClick={() => handleSelectReport(report)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText 
                        primary={report.name} 
                        secondary={`Date: ${new Date(report.reportDate).toLocaleDateString()}`} 
                      />
                    </ListItemButton>
                  </ListItem>
                )) : 
                <ListItem>
                  <ListItemText primary="No reports submitted yet." />
                </ListItem>
              }
            </List>
          </Paper>
          {/* Linked Departments */}
          <Paper sx={{ p: 2, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6" gutterBottom>Linked Departments</Typography>
            <List dense sx={{ maxHeight: 120, overflow: 'auto' }}>
              {linkedDepartments.length > 0 ? 
                linkedDepartments.map(dept => (
                  <ListItem key={dept._id}>
                    <ListItemText primary={dept.name} />
                  </ListItem>
                )) : 
                <ListItem>
                  <ListItemText primary="No departments linked yet." />
                </ListItem>
              }
            </List>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: '#1E1E1E', minHeight: 600 }}>
            <Typography variant="h5" gutterBottom>
              {selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}
            </Typography>
            {!selectedReport ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, flexDirection: 'column', color: 'text.secondary' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Select a report from the list on the left
                </Typography>
                <Typography>
                  View detailed analytics and visualizations for your selected report
                </Typography>
              </Box>
            ) : isAnalyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {/* Sankey Chart - Full width (move this above the Pie/Bar Grid) */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 2,
                    mb: 3,
                    width: '100%',
                    overflow: 'hidden',
                    height: 800
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChartIcon />
                      <Typography variant="h6">Fund Flow</Typography>
                    </Box>
                    <Tooltip title="Expand Chart">
                      <IconButton onClick={() => handleOpenFullscreen('Fund Flow', <SankeyChart data={analyticsData.flowchart} />)}>
                        <FullscreenIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ height: 500, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SankeyChart data={analyticsData.flowchart} />
                  </Box>
                </Paper>
                {/* Pie and Bar Chart Row */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        height: 500,
                        width: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PieChartIcon />
                        <Typography variant="h6">Spending by Department</Typography>
                        <Tooltip title="Expand Chart">
                          <IconButton onClick={() => handleOpenFullscreen('Spending by Department', <DepartmentPieChart data={analyticsData.departmentShare} />)}>
                            <FullscreenIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ height: 1000, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DepartmentPieChart data={analyticsData.departmentShare} />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        height: 500,
                        width: 800,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp />
                        <Typography variant="h6">Spending Trend</Typography>
                        <Tooltip title="Expand Chart">
                          <IconButton onClick={() => handleOpenFullscreen('Spending Trend', <SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} />)}>
                            <FullscreenIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ height: 1000, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* --- MODAL FOR NEW REPORT --- */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle} component="form" onSubmit={handleUploadReport}>
          <Typography variant="h6" component="h2">Create and Upload New Report</Typography>
          <TextField label="Report Name" value={newReportName} onChange={e => setNewReportName(e.target.value)} fullWidth margin="normal" required />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Report Type</InputLabel>
            <Select value={newReportType} label="Report Type" onChange={e => setNewReportType(e.target.value)}>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="annual">Annual</MenuItem>
              <MenuItem value="project">Project-Based</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField 
            type="date" 
            value={newReportDate} 
            onChange={e => setNewReportDate(e.target.value)} 
            fullWidth 
            margin="normal" 
            InputLabelProps={{ shrink: true }} 
            required 
          />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
            Select Transaction File (CSV or PDF)
            <input type="file" hidden onChange={e => setSelectedFile(e.target.files[0])} accept=".csv,.pdf" />
          </Button>
          {selectedFile && <Typography sx={{ mt: 1, textAlign: 'center' }}>{selectedFile.name}</Typography>}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Submit Report</Button>
        </Box>
      </Modal>

      {/* --- DIALOG FOR FULLSCREEN CHARTS --- */}
      <Dialog
        fullScreen
        open={fullscreenContent.open}
        onClose={handleCloseFullscreen}
        PaperProps={{ sx: { bgcolor: '#1E1E1E' } }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {fullscreenContent.title}
            </Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseFullscreen} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ width: '100%', height: 'calc(100% - 64px)', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {fullscreenContent.ChartComponent}
        </Box>
      </Dialog>
    </Container>
  );
};

export default InstitutionDashboard;