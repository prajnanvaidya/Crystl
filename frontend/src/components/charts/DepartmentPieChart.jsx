// src/components/charts/DepartmentPieChart.jsx - UPGRADED

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { Typography } from '@mui/material'; // Using MUI for consistent typography
import { useCurrency } from '../../context/CurrencyContext'; // Import the hook
// A more modern and vibrant color palette
const COLORS = ['#1e88e5', '#00acc1', '#ffc107', '#7cb342', '#f4511e', '#5e35b1'];

// --- A custom component for the active (hovered) pie slice ---
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={18} fontWeight="bold">
        {payload.departmentName}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`$${value.toLocaleString()}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


// --- A custom component for the Tooltip ---
const CustomTooltip = ({ active, payload }) => {
  const { formatAmount } = useCurrency();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200">
        <p className="font-semibold text-gray-800">{data.departmentName}</p>
        <p className="text-blue-600">Total Spent: {formatAmount(data.totalSpent)}</p>
      </div>
    );
  }
  return null;
};

// --- A custom component for the Legend ---
const CustomLegend = ({ payload }) => {
    return (
        <ul className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-700">
            {payload.map((entry, index) => (
                <li key={`item-${index}`} className="flex items-center">
                    <div style={{ width: 12, height: 12, backgroundColor: entry.color, marginRight: 8, borderRadius: '50%' }}></div>
                    <span>{entry.value}</span>
                </li>
            ))}
        </ul>
    );
};


const DepartmentPieChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!data || data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <PieChartIcon style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <Typography variant="body1">No approved spending data available to display.</Typography>
        </div>
    );
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // This creates the "donut" hole
          outerRadius={80}
          fill="#8884d8"
          dataKey="totalSpent"
          nameKey="departmentName"
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DepartmentPieChart;