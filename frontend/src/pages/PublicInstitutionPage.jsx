import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp } from '@mui/icons-material';

// --- Re-usable Chart Components ---
// We import the exact same components used in the private dashboards for consistency.
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// ==================================================================================
// ==                      PUBLIC INSTITUTION DETAIL PAGE                          ==
// ==================================================================================
const PublicInstitutionPage = () => {
  // --- STATE MANAGEMENT ---
  // useParams is a React Router hook that extracts dynamic segments from the URL (e.g., the ID).
  const { institutionId } = useParams();

  const [institution, setInstitution] = useState(null); // To store the institution's name.
  const [analyticsData, setAnalyticsData] = useState(null); // To hold data for all charts.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendGroupBy, setTrendGroupBy] = useState('monthly'); // State for the trend chart filter.

  // --- DATA FETCHING ---
  // This effect runs when the page loads or when the user changes the trend filter.
  useEffect(() => {
    const fetchPublicData = async () => {
      // Don't run if the ID isn't available yet.
      if (!institutionId) return;

      setIsLoading(true);
      setError('');

      try {
        // Fetch all necessary public data concurrently for speed.
        const flowchartPromise = api.get(`/public/flowchart/${institutionId}`);
        const deptSharePromise = api.get(`/public/analytics/${institutionId}/department-share`);
        const spendingTrendPromise = api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`);

        const [flowchartRes, deptShareRes, spendingTrendRes] = await Promise.all([
          flowchartPromise,
          deptSharePromise,
          spendingTrendPromise
        ]);
        
        // The flowchart endpoint conveniently contains the institution's name.
        setInstitution(flowchartRes.data.institution);
        
        // Populate the state with the data needed for our chart components.
        setAnalyticsData({
          flowchart: flowchartRes.data,
          departmentShare: deptShareRes.data.departmentShares,
          spendingTrend: spendingTrendRes.data.spendingTrend,
        });

      } catch (err) {
        setError('Failed to load public data. The institution may not have any approved financial records.');
        console.error("Public data fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicData();
  }, [institutionId, trendGroupBy]); // Re-run effect if the ID in the URL or the filter changes.

  // --- HANDLERS ---
  // This handler is passed down to the SpendingTrendChart component.
  const handleTrendFilterChange = (event, newGroupBy) => {
    // Check for null ensures the toggle button group works correctly.
    if (newGroupBy !== null) {
      setTrendGroupBy(newGroupBy);
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Public Financial Overview
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
        {institution?.name}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6" gutterBottom><BarChartIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Fund Flow</Typography>
            <SankeyChart data={analyticsData.flowchart} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6" gutterBottom><PieChartIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> Spending by Department</Typography>
            <DepartmentPieChart data={analyticsData.departmentShare} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1E1E1E' }}>
            <Typography variant="h6" gutterBottom><TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }}/> Spending Trend</Typography>
            <SpendingTrendChart
              data={analyticsData.spendingTrend}
              groupBy={trendGroupBy}
              handleFilterChange={handleTrendFilterChange}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PublicInstitutionPage;