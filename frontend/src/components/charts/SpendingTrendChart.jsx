import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

// A helper to format the month number into a short name
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SpendingTrendChart = ({ data, groupBy, handleFilterChange }) => {
  // Memoize the data transformation so it only runs when the data or groupBy filter changes.
  const chartData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => {
      let name = '';
      const year = item._id.year;
      // Create a human-readable label for the X-axis based on the grouping
      switch (groupBy) {
        case 'quarterly':
          name = `Q${item._id.quarter} ${year}`;
          break;
        case 'annually':
          name = `${year}`;
          break;
        case 'monthly':
        default:
          const month = monthNames[item._id.month - 1]; // month is 1-12
          name = `${month} ${year}`;
          break;
      }
      return {
        name,
        Spending: item.totalSpent,
      };
    });
  }, [data, groupBy]);

  if (!data || data.length === 0) {
    return <p>No approved spending data available for this period.</p>;
  }

  return (
    <Box sx={{ width: '100%', height: 250 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <ToggleButtonGroup
  value={groupBy}
  exclusive
  onChange={handleFilterChange}
  size="small"
>
  <ToggleButton value="monthly" sx={{ color: 'black' }}>Monthly</ToggleButton>
  <ToggleButton value="quarterly" sx={{ color: 'black' }}>Quarterly</ToggleButton>
  <ToggleButton value="annually" sx={{ color: 'black' }}>Annually</ToggleButton>
</ToggleButtonGroup>
        </Box>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="Spending" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SpendingTrendChart;