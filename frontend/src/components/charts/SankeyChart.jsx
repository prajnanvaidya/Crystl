// src/components/charts/SankeyChart.jsx

import React from 'react';
import { Chart } from 'react-google-charts';
import { Box, Typography } from '@mui/material';

// FIX: Removed the 'export' keyword. 
// This is now a local constant, which is correct.
const options = {
  sankey: {
    node: {
      colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'],
      label: { 
        color: '#000000',
        fontName: 'Roboto', 
        fontSize: 14 
      },
      interactivity: true,
    },
    link: {
      colorMode: 'gradient',
      colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'],
    },
  },
  backgroundColor: 'transparent',
};

const SankeyChart = ({ data }) => {
  const chartData = data?.sankeyData;

  if (!chartData || chartData.length <= 1) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary" textAlign="center">
          No fund flow data available.
          <br />
          Approve allocations and log department spending to see the flow.
        </Typography>
      </Box>
    );
  }

  return (
    <Chart
      chartType="Sankey"
      width="98%"
      height="100%"
      data={chartData}
      options={options} // The local constant is used here correctly.
      loader={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">Loading Chart...</Typography>
        </Box>
      }
    />
  );
};

export default SankeyChart;