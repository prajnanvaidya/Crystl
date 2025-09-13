import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Modal,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp } from '@mui/icons-material';

// --- Final Step: Import the real, functional chart components ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// --- STYLES FOR THE MODAL ---
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
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

  // --- DATA FETCHING ---
  // Fetch initial data (reports and departments) when the component mounts.
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
        const errorMessage = err.response?.data?.msg || 'Failed to load initial dashboard data.';
        setError(errorMessage);
        setLinkedDepartments([]);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []); // Empty array ensures this runs only once.

  // --- HANDLERS ---
  const handleLinkDepartment = async (e) => {
    e.preventDefault();
    // Use a specific loading state for this action if needed, or the general one.
    // For simplicity, we'll reuse the general one but a dedicated one is better for complex UIs.
    try {
      const { data } = await api.post('/institution/link-department', { departmentId: departmentIdToLink });
      setSuccess(data.msg);
      // Refetch departments to show the newly linked one.
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
    // A dedicated loading state for the modal button could be used here.
    const formData = new FormData();
    formData.append('name', newReportName);
    formData.append('type', newReportType);
    formData.append('reportDate', newReportDate);
    formData.append('transactionsFile', selectedFile);
    try {
      const { data } = await api.post('/institution/upload-transactions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(data.msg);
      // Refetch reports to show the new one.
      const response = await api.get('/institution/reports');
      setReports(response.data.reports);
      // Close modal and reset form.
      setIsModalOpen(false);
      setNewReportName(''); setNewReportDate(''); setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'File upload failed.');
    }
  };
  
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setIsAnalyticsLoading(true);
    setError('');
    try {
      // Fetch all analytics data for the institution based on the current state.
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
      setError(err.response?.data?.msg || "Could not load analytics for this report.");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleTrendFilterChange = async (event, newGroupBy) => {
    if (newGroupBy !== null) {
      setTrendGroupBy(newGroupBy);
      // Refetch just the trend data to update the chart.
      setIsAnalyticsLoading(true); // Can use a more specific loading state if desired.
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

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, bgcolor: '#121212', color: 'white', borderRadius: 2, p: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome, {user?.name}</Typography>
      
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* --- LEFT COLUMN: Lists and Actions --- */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6" gutterBottom>Management</Typography>
            <Button variant="contained" fullWidth onClick={() => setIsModalOpen(true)} sx={{ mb: 2 }}>Create New Report</Button>
            <Divider />
            <Box component="form" onSubmit={handleLinkDepartment} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Link a Department</Typography>
              <TextField label="Department ID" value={departmentIdToLink} onChange={e => setDepartmentIdToLink(e.target.value)} fullWidth margin="dense" required />
              <Button type="submit" variant="outlined" fullWidth sx={{ mt: 1 }}>Link Department</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, mb: 3, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6">Submitted Reports</Typography>
            <List>{reports.length > 0 ? reports.map(report => (<ListItem key={report._id} disablePadding><ListItemButton selected={selectedReport?._id === report._id} onClick={() => handleSelectReport(report)}><ListItemText primary={report.name} secondary={`Date: ${new Date(report.reportDate).toLocaleDateString()}`} /></ListItemButton></ListItem>)) : (<ListItem><ListItemText primary="No reports submitted yet." /></ListItem>)}</List>
          </Paper>
            
          <Paper sx={{ p: 2, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6">Linked Departments</Typography>
            <List>{linkedDepartments.length > 0 ? linkedDepartments.map(dept => (<ListItem key={dept._id}><ListItemText primary={dept.name} /></ListItem>)) : (<ListItem><ListItemText primary="No departments linked yet." /></ListItem>)}</List>
          </Paper>
        </Grid>
        
        {/* --- RIGHT COLUMN: Analytics Display --- */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: '80vh', bgcolor: '#1E1E1E' }}>
            <Typography variant="h5" gutterBottom>{selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}</Typography>
            {!selectedReport ? (
              <Typography color="text.secondary">Select a report from the list on the left to view its detailed analytics.</Typography>
            ) : isAnalyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom><BarChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Fund Flow</Typography>
                    <SankeyChart data={analyticsData.flowchart} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom><PieChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Spending by Department</Typography>
                    <DepartmentPieChart data={analyticsData.departmentShare} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="h6" gutterBottom><TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} /> Spending Trend</Typography>
                    <SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} />
                  </Paper>
                </Grid>
              </Grid>
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
              <MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annual">Annual</MenuItem><MenuItem value="project">Project-Based</MenuItem><MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField type="date" value={newReportDate} onChange={e => setNewReportDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
            Select Transaction File (CSV or PDF)
            <input type="file" hidden onChange={e => setSelectedFile(e.target.files[0])} accept=".csv,.pdf" />
          </Button>
          {selectedFile && <Typography sx={{ mt: 1, textAlign: 'center' }}>{selectedFile.name}</Typography>}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Submit Report</Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default InstitutionDashboard;