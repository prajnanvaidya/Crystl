import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Fullscreen as FullscreenIcon, 
  Close as CloseIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

// Import Chart Components
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

const InstitutionDashboard = () => {
  // State management
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkedDepartments, setLinkedDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({ 
    flowchart: null, 
    departmentShare: null, 
    spendingTrend: null 
  });
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [departmentIdToLink, setDepartmentIdToLink] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportType, setNewReportType] = useState('monthly');
  const [newReportDate, setNewReportDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fullscreenContent, setFullscreenContent] = useState({ 
    open: false, 
    title: '', 
    ChartComponent: null 
  });

  // Data fetching
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

  // Handlers
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
      const { data } = await api.post('/institution/upload-transactions', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
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
      const [flowchartRes, deptShareRes, spendingTrendRes] = await Promise.all([
        flowchartPromise, 
        deptSharePromise, 
        spendingTrendPromise
      ]);
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

  // Render logic
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl text-center font-bold text-gray-900">Institution Dashboard</h1>
          <p className="text-gray-600 text-center">Manage reports, departments, and view analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success and Error Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            {/* Management Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BusinessIcon className="mr-2 text-blue-600" />
                Management
              </h3>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center mb-4 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <AddIcon className="mr-2" />
                Create New Report
              </button>
              
              <div className="border-t border-gray-200 my-4"></div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                  <LinkIcon className="mr-2 text-blue-600" />
                  Link a Department
                </h4>
                <form onSubmit={handleLinkDepartment}>
                  <input
                    type="text"
                    placeholder="Enter Department ID"
                    value={departmentIdToLink}
                    onChange={e => setDepartmentIdToLink(e.target.value)}
                    className="w-full p-3 mb-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Link Department
                  </button>
                </form>
              </div>
            </div>

            {/* Submitted Reports Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DescriptionIcon className="mr-2 text-blue-600" />
                Submitted Reports
              </h3>
              <div className="max-h-72 overflow-y-auto">
                {reports.length > 0 ? (
                  <ul className="space-y-2">
                    {reports.map(report => (
                      <li key={report._id}>
                        <button
                          className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                            selectedReport?._id === report._id 
                              ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                          onClick={() => handleSelectReport(report)}
                        >
                          <div className="font-medium truncate">{report.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(report.reportDate).toLocaleDateString()} • {report.type}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <DescriptionIcon className="mx-auto text-gray-300 mb-2" style={{ fontSize: '2.5rem' }} />
                    <p>No reports submitted yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Departments Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BusinessIcon className="mr-2 text-blue-600" />
                Linked Departments
              </h3>
              <div className="max-h-48 overflow-y-auto">
                {linkedDepartments.length > 0 ? (
                  <ul className="space-y-2">
                    {linkedDepartments.map(dept => (
                      <li key={dept._id} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {dept.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No departments linked yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}
              </h2>
              
              {!selectedReport ? (
                <div className="flex flex-col justify-center items-center h-96 text-gray-400">
                  <BarChartIcon style={{ fontSize: '4rem', marginBottom: '1rem' }} />
                  <h3 className="text-lg mb-2 text-gray-500">Select a report to view analytics</h3>
                  <p className="text-center max-w-md">Choose a report from the list on the left to see detailed analytics and visualizations</p>
                </div>
              ) : isAnalyticsLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics data...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sankey Chart - Full width */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 w-full h-[500px] overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <BarChartIcon className="text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Fund Flow</h3>
                      </div>
                      <button 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                        onClick={() => handleOpenFullscreen('Fund Flow', <SankeyChart data={analyticsData.flowchart} />)}
                      >
                        <FullscreenIcon />
                      </button>
                    </div>
                    <div className="h-[420px] w-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
                      <SankeyChart data={analyticsData.flowchart} />
                    </div>
                  </div>

                  {/* Pie and Bar Chart Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 h-[400px] flex flex-col">
                      <div className="flex items-center mb-4">
                        <PieChartIcon className="text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Spending by Department</h3>
                        <button 
                          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 ml-auto"
                          onClick={() => handleOpenFullscreen(
                            'Spending by Department', 
                            <DepartmentPieChart data={analyticsData.departmentShare} />
                          )}
                        >
                          <FullscreenIcon />
                        </button>
                      </div>
                      <div className="h-full w-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
                        <DepartmentPieChart data={analyticsData.departmentShare} />
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 h-[400px] flex flex-col">
                      <div className="flex items-center mb-4">
                        <TrendingUp className="text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Spending Trend</h3>
                        <button 
                          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 ml-auto"
                          onClick={() => handleOpenFullscreen(
                            'Spending Trend', 
                            <SpendingTrendChart 
                              data={analyticsData.spendingTrend} 
                              groupBy={trendGroupBy} 
                              handleFilterChange={handleTrendFilterChange} 
                            />
                          )}
                        >
                          <FullscreenIcon />
                        </button>
                      </div>
                      <div className="h-full w-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
                        <SpendingTrendChart 
                          data={analyticsData.spendingTrend} 
                          groupBy={trendGroupBy} 
                          handleFilterChange={handleTrendFilterChange} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for New Report */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create and Upload New Report</h2>
            <form onSubmit={handleUploadReport}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Report Name</label>
                <input
                  type="text"
                  placeholder="Enter report name"
                  value={newReportName}
                  onChange={e => setNewReportName(e.target.value)}
                  className="w-full text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Report Type</label>
                <select
                  value={newReportType}
                  onChange={e => setNewReportType(e.target.value)}
                  className="w-full text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="project">Project-Based</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Report Date</label>
                <input
                  type="date"
                  value={newReportDate}
                  onChange={e => setNewReportDate(e.target.value)}
                  className="text-black w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Transaction File</label>
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <span className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'Click to upload CSV or PDF file'}
                  </span>
                  <input 
                    type="file" 
                    className="hidden text-black" 
                    onChange={e => setSelectedFile(e.target.files[0])} 
                    accept=".csv,.pdf" 
                  />
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Chart Dialog */}
      {fullscreenContent.open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">{fullscreenContent.title}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              onClick={handleCloseFullscreen}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
            {fullscreenContent.ChartComponent}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;