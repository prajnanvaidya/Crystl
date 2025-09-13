// src/pages/PublicInstitutionPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  ListItemButton,
  Tooltip
} from '@mui/material';
import {
  Description as ReportIcon,
  Business as DepartmentIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

// --- Import Chart Components ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// --- Import the new Floating Chatbot ---
import FloatingChatbotPublic from '../components/chatbot/FloatingChatbotPublic';

const PublicInstitutionPage = () => {
  const { institutionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [pageData, setPageData] = useState({
    institution: null,
    departments: [],
    reports: [],
    flowchart: null,
    departmentShare: [],
    spendingTrend: [],
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!institutionId) return;
      setIsLoading(true);
      setError('');
      try {
        const detailsPromise = api.get(`/public/institution/${institutionId}/details`);
        const departmentsPromise = api.get(`/public/institution/${institutionId}/departments`);
        const reportsPromise = api.get(`/public/institution/${institutionId}/reports`);

        const [detailsRes, departmentsRes, reportsRes] = await Promise.all([
          detailsPromise,
          departmentsPromise,
          reportsPromise,
        ]);

        setPageData(prev => ({
          ...prev,
          institution: detailsRes.data.institution,
          departments: departmentsRes.data.departments,
          reports: reportsRes.data.reports,
        }));
      } catch (err) {
        setError('Failed to load institution details. This institution may not exist or have public records.');
        console.error("Initial data fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [institutionId]);

  // --- HANDLERS ---
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setIsAnalyticsLoading(true);
    setError('');
    try {
      const flowchartPromise = api.get(`/public/flowchart/${institutionId}`);
      const deptSharePromise = api.get(`/public/analytics/${institutionId}/department-share`);
      const spendingTrendPromise = api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`);

      const [flowchartRes, deptShareRes, spendingTrendRes] = await Promise.all([
        flowchartPromise,
        deptSharePromise,
        spendingTrendPromise,
      ]);
      
      setPageData(prev => ({
        ...prev,
        flowchart: flowchartRes.data,
        departmentShare: deptShareRes.data.departmentShares,
        spendingTrend: spendingTrendRes.data.spendingTrend,
      }));
    } catch (err) {
      setError('Failed to load analytics for the selected report.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };
  
  const handleTrendFilterChange = useCallback(async (event, newGroupBy) => {
    if (newGroupBy !== null) {
      setTrendGroupBy(newGroupBy);
      if (selectedReport) {
        try {
          const { data } = await api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${newGroupBy}`);
          setPageData(prev => ({ ...prev, spendingTrend: data.spendingTrend }));
        } catch (err) {
          setError("Failed to update spending trend data.");
        }
      }
    }
  }, [institutionId, selectedReport]);
  
  const handleStartChat = async (departmentId) => {
    setError('');
    try {
      const { data } = await api.post('/chat', { departmentId });
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not start chat session. Please log in.');
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }
  
  if (error && !pageData.institution) {
     return <Container><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container>;
  }

  return (
    // Use a Fragment to allow the chatbot to be a sibling to the main container
    <>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {pageData.institution?.name || 'Institution Overview'}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Public Financial Overview
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

        {/* --- DEPARTMENTS AND REPORTS SECTION --- */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Linked Departments</Typography>
              <List>
                {pageData.departments?.length > 0 ? pageData.departments.map((dept) => (
                  <ListItem key={dept._id} secondaryAction={
                    user && user.role === 'User' && (
                      <Tooltip title="Start a public chat with this department">
                        <IconButton edge="end" aria-label="chat" onClick={() => handleStartChat(dept._id)}>
                          <ChatIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }>
                    <ListItemIcon><DepartmentIcon /></ListItemIcon>
                    <ListItemText primary={dept.name} />
                  </ListItem>
                )) : <ListItem><ListItemText primary="No public departments found." /></ListItem>}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Financial Reports</Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {pageData.reports?.length > 0 ? pageData.reports.map((report) => (
                  <ListItemButton 
                    key={report._id}
                    selected={selectedReport?._id === report._id}
                    onClick={() => handleSelectReport(report)}
                  >
                    <ListItemIcon><ReportIcon /></ListItemIcon>
                    <ListItemText
                      primary={report.name}
                      secondary={`Date: ${new Date(report.reportDate).toLocaleDateString()}`}
                    />
                  </ListItemButton>
                )) : <ListItem><ListItemText primary="No public reports available." /></ListItem>}
              </List>
            </Paper>
          </Grid>
        </Grid>
        
        {/* --- CHARTS & ANALYTICS SECTION --- */}
        <Paper sx={{ p: 3, bgcolor: '#1E1E1E' }}>
          <Typography variant="h5" gutterBottom>
            {selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}
          </Typography>
          
          {!selectedReport ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, flexDirection: 'column', color: 'text.secondary' }}>
              <Typography variant="h6">Select a report from the list above</Typography>
              <Typography>View detailed analytics and visualizations</Typography>
            </Box>
          ) : isAnalyticsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, height: 450 }}>
                  <Typography variant="h6" gutterBottom><BarChartIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Fund Flow</Typography>
                  {pageData.flowchart ? <SankeyChart data={pageData.flowchart} /> : <Typography>No fund flow data available.</Typography>}
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                  <Typography variant="h6" gutterBottom><PieChartIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Spending by Department</Typography>
                  {pageData.departmentShare ? <DepartmentPieChart data={pageData.departmentShare} /> : <Typography>No department spending data available.</Typography>}
                </Paper>
              </Grid>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" gutterBottom><TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Spending Trend</Typography>
                    <ToggleButtonGroup value={trendGroupBy} exclusive onChange={handleTrendFilterChange} size="small">
                      <ToggleButton value="monthly">Monthly</ToggleButton>
                      <ToggleButton value="quarterly">Quarterly</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  {pageData.spendingTrend ? <SpendingTrendChart data={pageData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={() => {}} /> : <Typography>No spending trend data available.</Typography>}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Container>
      
      {/* Render the floating chatbot here, passing the current institutionId */}
      {!isLoading && institutionId && user  && (
        <FloatingChatbotPublic institutionId={institutionId} />
      )}
    </>
  );
};

export default PublicInstitutionPage;