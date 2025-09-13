import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';

// Custom options to style the Sankey diagram
export const options = {
  sankey: {
    node: {
      colors: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c'],
      label: { color: '#000' },
    },
    link: {
      colorMode: 'gradient',
      colors: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c'],
    },
  },
};

const SankeyChart = ({ data }) => {
  // useMemo is a React hook that memoizes the result of a function.
  // This ensures our data transformation logic only runs when the input 'data' prop changes.
  const sankeyData = useMemo(() => {
    // If there's no data or no allocations, return null to show the loading/empty message
    if (!data || !data.allocations || data.allocations.length === 0) {
      return null;
    }

    // The first row of the data must be the column headers
    const chartData = [['From', 'To', 'Amount']];

    const institutionName = data.institution.name;

    // Iterate over each department allocation from the API response
    data.allocations.forEach(allocation => {
      const departmentName = allocation.departmentName;
      const departmentTotal = allocation.departmentTotal;

      // 1. Create the flow from the main Institution to the Department
      if (departmentTotal > 0) {
        chartData.push([institutionName, departmentName, departmentTotal]);
      }
      
      // 2. Create the sub-flows from the Department to their final status (completed, disputed, etc.)
      allocation.breakdown.forEach(breakdownItem => {
        if (breakdownItem.amount > 0) {
            // Capitalize the status for better readability in the chart
            const statusCapitalized = breakdownItem.status.charAt(0).toUpperCase() + breakdownItem.status.slice(1).replace('_', ' ');
            chartData.push([departmentName, statusCapitalized, breakdownItem.amount]);
        }
      });
    });

    return chartData;
  }, [data]); // The dependency array: this code re-runs only if 'data' changes

  // --- RENDER LOGIC ---
  if (!sankeyData) {
    return <p>No fund flow data available. Approve transactions to see the flow.</p>;
  }

  return (
    <Chart
      chartType="Sankey"
      width="100%"
      height="300px"
      data={sankeyData}
      options={options}
    />
  );
};

export default SankeyChart;