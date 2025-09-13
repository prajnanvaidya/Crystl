// src/pages/InstitutionDashboard.jsx - COMPLETE with Anomaly Detection Feature

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// --- Icon Imports ---
import {
  Add as AddIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  WarningAmber as WarningIcon, // <-- Icon for anomalies
} from '@mui/icons-material';
import { CloudUploadIcon } from '@heroicons/react/solid';

// --- Chart Component Imports ---
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

const InstitutionDashboard = () => {
  // --- STATE MANAGEMENT ---
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkedDepartments, setLinkedDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [anomalies, setAnomalies] = useState([]); // <-- NEW STATE FOR ANOMALIES
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

  // --- DATA FETCHING (Now includes anomalies) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const departmentsPromise = api.get('/institution/linked-departments');
        const reportsPromise = api.get('/institution/reports');
        const anomaliesPromise = api.get('/institution/anomalies'); // Fetch anomalies

        const [departmentsRes, reportsRes, anomaliesRes] = await Promise.all([
          departmentsPromise,
          reportsPromise,
          anomaliesPromise,
        ]);
        setLinkedDepartments(departmentsRes.data.departments);
        setReports(reportsRes.data.reports);
        setAnomalies(anomaliesRes.data.anomalies); // Set anomaly state
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load initial dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- HANDLERS (No changes to logic) ---
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
      // Refetch reports AND anomalies after a successful upload
      const reportsRes = await api.get('/institution/reports');
      const anomaliesRes = await api.get('/institution/anomalies');
      setReports(reportsRes.data.reports);
      setAnomalies(anomaliesRes.data.anomalies);

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


  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">Welcome, {user?.name}</h1>
              <p className="mt-1 text-md text-gray-500">Here’s your institution’s financial command center.</p>
            </div>
            <button className="mt-4 sm:mt-0 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" onClick={() => setIsModalOpen(true)}>
              <AddIcon className="mr-2" /> Create New Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-6 shadow-sm" role="alert"><p className="font-bold">Success</p><p>{success}</p></div>}
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-6 shadow-sm" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
            
            {/* --- NEW ANOMALY CARD --- */}
            <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                <WarningIcon className="mr-2 text-red-500" />
                Spending Alerts
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {anomalies.length > 0 ? (
                  anomalies.map((anomaly) => (
                    <div
                      key={anomaly._id}
                      className="bg-red-50 border border-red-200 p-3 rounded-lg"
                    >
                      <p className="text-sm font-medium text-red-800">
                        {anomaly.message}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Detected on: {new Date(anomaly.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <WarningIcon className="mx-auto text-green-400 mb-2" style={{ fontSize: '2.5rem' }} />
                    <p>No spending anomalies detected. All departments are within budget.</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- Submitted Reports Card --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><DescriptionIcon className="mr-2 text-blue-600" />Submitted Reports</h3>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {reports.length > 0 ? reports.map(report => (
                  <button key={report._id} className={`w-full text-left p-3 rounded-lg transition-all duration-200 border-2 ${selectedReport?._id === report._id ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-inner' : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200 text-gray-700'}`} onClick={() => handleSelectReport(report)}>
                    <div className="font-semibold truncate">{report.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(report.reportDate).toLocaleDateString()} • {report.type}</div>
                  </button>
                )) : <div className="text-center py-6 text-gray-500"><DescriptionIcon className="mx-auto text-gray-300 mb-2" style={{ fontSize: '2.5rem' }} /><p>No reports submitted yet.</p></div>}
              </div>
            </div>

            {/* --- Link a Department Card --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><LinkIcon className="mr-2 text-blue-600" />Link a Department</h3>
              <form onSubmit={handleLinkDepartment} className="space-y-3">
                <input type="text" placeholder="Enter Department ID (e.g., DEPT-..)" value={departmentIdToLink} onChange={e => setDepartmentIdToLink(e.target.value)} className="w-full p-3 text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" required />
                <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300 transform hover:scale-105">Link Department</button>
              </form>
            </div>
            
            {/* --- Linked Departments Card --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BusinessIcon className="mr-2 text-blue-600" />Linked Departments</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {linkedDepartments.length > 0 ? linkedDepartments.map(dept => (
                  <div key={dept._id} className="p-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-800">{dept.name}</div>
                )) : <div className="text-center py-4 text-gray-500"><p>No departments linked.</p></div>}
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN (ANALYTICS) */}
          <section className="lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[80vh] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              {!selectedReport ? (
                <div className="flex flex-col justify-center items-center h-full text-gray-400 text-center"><BarChartIcon style={{ fontSize: '4rem', marginBottom: '1rem' }} /><h3 className="text-xl font-semibold text-gray-600">Analytics Dashboard</h3><p className="mt-2 max-w-md">Please select a report from the list on the left to visualize its financial data.</p></div>
              ) : isAnalyticsLoading ? (
                <div className="flex justify-center items-center h-full"><div className="text-center"><svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4 text-gray-600 font-medium">Loading analytics data...</p></div></div>
              ) : (
                <div className="space-y-8">
                   <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 relative h-[500px] flex flex-col"><div className="flex justify-between items-center mb-2"><h4 className="text-lg font-semibold text-gray-800 flex items-center"><BarChartIcon className="mr-2 text-blue-600" />Fund Flow</h4><button className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors" onClick={() => handleOpenFullscreen('Fund Flow', <SankeyChart data={analyticsData.flowchart} />)}><FullscreenIcon /></button></div><div className="flex-grow w-full h-full"><SankeyChart data={analyticsData.flowchart} /></div></div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 relative h-[400px] flex flex-col"><div className="flex justify-between items-center mb-2"><h4 className="text-lg font-semibold text-gray-800 flex items-center"><PieChartIcon className="mr-2 text-blue-600" />Department Spending</h4><button className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors" onClick={() => handleOpenFullscreen('Spending by Department', <DepartmentPieChart data={analyticsData.departmentShare} />)}><FullscreenIcon /></button></div><div className="flex-grow w-full h-full"><DepartmentPieChart data={analyticsData.departmentShare} /></div></div>
                    <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 relative h-[400px] flex flex-col"><div className="flex justify-between items-center mb-2"><h4 className="text-lg font-semibold text-gray-800 flex items-center"><TrendingUp className="mr-2 text-blue-600" />Spending Trend</h4><button className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors" onClick={() => handleOpenFullscreen('Spending Trend', <SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} />)}><FullscreenIcon /></button></div><div className="flex-grow w-full h-full"><SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} /></div></div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create & Upload New Report</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
            </div>
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div><label className="block text-gray-700 text-sm font-medium mb-1">Report Name</label><input type="text" placeholder="e.g., Q3 Financial Summary" value={newReportName} onChange={e => setNewReportName(e.target.value)} className="w-full text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-700 text-sm font-medium mb-1">Report Type</label><select value={newReportType} onChange={e => setNewReportType(e.target.value)} className="w-full text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="project">Project-Based</option><option value="other">Other</option></select></div>
                <div><label className="block text-gray-700 text-sm font-medium mb-1">Report Date</label><input type="date" value={newReportDate} onChange={e => setNewReportDate(e.target.value)} className="text-black w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required /></div>
              </div>
              <div><label className="block text-gray-700 text-sm font-medium mb-2">Transaction File</label><label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"><CloudUploadIcon className="w-10 h-10 text-gray-400 mb-2" /><span className="text-sm text-gray-600 font-semibold">{selectedFile ? selectedFile.name : 'Click to upload CSV or PDF'}</span><span className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</span><input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} accept=".csv,.pdf" /></label></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button type="button" className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-700 transition-colors">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FULLSCREEN DIALOG --- */}
      {fullscreenContent.open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">{fullscreenContent.title}</h3>
            <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100" onClick={handleCloseFullscreen}><CloseIcon /></button>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
            {React.cloneElement(fullscreenContent.ChartComponent, { isFullscreen: true })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;