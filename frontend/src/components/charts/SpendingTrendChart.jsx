// src/components/charts/SpendingTrendChart.jsx - UPDATED with Gridlines

import React, { useMemo } from 'react';
// --- CHANGE #1: Import the CartesianGrid component ---
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { useCurrency } from '../../context/CurrencyContext'; // Import the hook
const RoundedBar = (props) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  return (
    <g>
      <path d={`M${x},${y + radius} A${radius},${radius} 0 0 1 ${x + radius},${y} L${x + width - radius},${y} A${radius},${radius} 0 0 1 ${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  const { formatAmount } = useCurrency();
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-blue-600 font-medium">Spending: {formatAmount(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SpendingTrendChart = ({ data, groupBy, handleFilterChange, isFullscreen = false }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(item => {
      let name = '';
      const year = item._id.year;
      switch (groupBy) {
        case 'quarterly': name = `Q${item._id.quarter} ${year}`; break;
        case 'annually': name = `${year}`; break;
        case 'monthly':
        default: name = `${monthNames[item._id.month - 1]} ${year}`; break;
      }
      return { name, Spending: item.totalSpent };
    });
  }, [data, groupBy]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <BarChartIcon style={{ fontSize: '3rem', marginBottom: '1rem' }} />
        <Typography variant="body1">No spending data available for this period.</Typography>
      </div>
    );
  }

  const unselectedButtonStyle = {
    color: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'rgba(0, 0, 0, 0.23)',
  };

  return (
    <Box sx={{ width: '100%', height: isFullscreen ? '100%' : 350, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, px: 2 }}>
        <ToggleButtonGroup
            color="primary"
            value={groupBy}
            exclusive
            onChange={handleFilterChange}
            size="small"
            aria-label="Filter spending trend"
        >
          <ToggleButton value="monthly" sx={unselectedButtonStyle}>Monthly</ToggleButton>
          <ToggleButton value="quarterly" sx={unselectedButtonStyle}>Quarterly</ToggleButton>
          <ToggleButton value="annually" sx={unselectedButtonStyle}>Annually</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: isFullscreen ? 40 : 20, left: isFullscreen ? 20 : -10, bottom: 5 }}
            barSize={30}
          >
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e88e5" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#00acc1" stopOpacity={0.8}/>
              </linearGradient>
            </defs>

            {/* --- CHANGE #2: Add the CartesianGrid component here --- */}
            <CartesianGrid 
              strokeDasharray="3 3" // Creates a dashed line effect
              stroke="#e0e0e0"     // A light gray color for the lines
              vertical={false}       // This ensures ONLY horizontal lines are drawn
            />

            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#D1D5DB" tickLine={false} axisLine={false} angle={isFullscreen && chartData.length > 12 ? -45 : 0} textAnchor={isFullscreen && chartData.length > 12 ? "end" : "middle"} height={isFullscreen && chartData.length > 12 ? 60 : 30} />
            <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#D1D5DB" tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(230, 230, 230, 0.4)', radius: 6 }} />
            <Bar dataKey="Spending" fill="url(#colorSpending)" shape={<RoundedBar />}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default SpendingTrendChart;