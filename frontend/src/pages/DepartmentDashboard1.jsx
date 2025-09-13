// src/pages/DepartmentDashboard.jsx - FINAL VERSION (COMPLETE AND UNCUT)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import {
  IoCheckmarkCircleOutline, IoWarningOutline, IoCopyOutline, IoStatsChartOutline,
  IoTimeOutline, IoBusinessOutline, IoDocumentTextOutline, IoCheckmarkCircle,
  IoCloseCircle, IoReloadCircle, IoCloseOutline, IoCloudUploadOutline, IoAdd
} from 'react-icons/io5';

// Import Chart Components
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0); // 0: Approvals, 1: Log Spending, 2: Analytics
  
  // State for different tabs
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [linkedDepartments, setLinkedDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Loading states
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  
  // Analytics state
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  
  // State for upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // General UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsDataLoading(true);
      setError('');
      try {
        const promises = [api.get('/department/pending-transactions')];
        if (user?.linkedInstitution) {
          promises.push(api.get(`/public/institution/${user.linkedInstitution}/departments`));
        }
        const responses = await Promise.all(promises);
        setPendingTransactions(responses[0].data.transactions);
        if (responses[1]) {
          setLinkedDepartments(responses[1].data.departments.filter(d => d.name !== user.name));
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch initial dashboard data.'));
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchReports = async () => {
      if (currentTab === 2 && user?.linkedInstitution && reports.length === 0) { // Tab index is now 2
        setIsAnalyticsLoading(true);
        try {
          const { data } = await api.get(`/public/institution/${user.linkedInstitution}/reports`);
          setReports(data.reports);
        } catch (err) {
          setError(getErrorMessage(err, 'Could not load institution reports.'));
        } finally {
          setIsAnalyticsLoading(false);
        }
      }
    };
    fetchReports();
  }, [currentTab, user, reports.length]);

  // --- HANDLERS ---
  const handleTabChange = (newValue) => {
    setCurrentTab(newValue);
    setSelectedReport(null);
    setAnalyticsData(null);
  };
  
  const handleUploadSpendingReport = async (e) => {
    e.preventDefault();
    if (!selectedFile || !newReportName) {
      setError('Please provide a report name and select a file.');
      return;
    }
    setError(''); setSuccess('');
    const formData = new FormData();
    formData.append('reportName', newReportName);
    formData.append('spendingFile', selectedFile);

    try {
      const { data } = await api.post('/department/upload-spending', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(data.msg);
      setIsModalOpen(false);
      setNewReportName('');
      setSelectedFile(null);
    } catch (err) {
      setError(getErrorMessage(err, 'File upload failed.'));
    }
  };

  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setIsAnalyticsLoading(true);
    setError('');
    try {
      const institutionId = user.linkedInstitution;
      const [flowchartRes, deptShareRes, trendRes] = await Promise.all([
        api.get(`/public/flowchart/${institutionId}`),
        api.get(`/public/analytics/${institutionId}/department-share`),
        api.get(`/public/analytics/${institutionId}/spending-trend?groupBy=${trendGroupBy}`)
      ]);
      setAnalyticsData({
        flowchart: flowchartRes.data,
        departmentShare: deptShareRes.data.departmentShares,
        spendingTrend: trendRes.data.spendingTrend,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load analytics for the selected report.'));
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleVerifyTransaction = async (transactionId, newStatus) => {
    setActionInProgress(transactionId);
    setError(''); setSuccess('');
    try {
      await api.patch(`/department/verify-transaction/${transactionId}`, { status: newStatus });
      setSuccess(`Transaction successfully marked as ${newStatus}.`);
      setPendingTransactions(prev => prev.filter(t => t._id !== transactionId));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update transaction.'));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCopyToClipboard = () => {
    if (user?.departmentId) {
      navigator.clipboard.writeText(user.departmentId);
      setSuccess('Department ID copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };
  
  const handleTrendFilterChange = (newGroupBy) => {
    if (newGroupBy !== null) setTrendGroupBy(newGroupBy);
  };

  const handleRefreshData = async () => {
    if (currentTab === 0) {
      setIsDataLoading(true);
      setError('');
      try {
        const { data } = await api.get('/department/pending-transactions');
        setPendingTransactions(data.transactions);
        setSuccess('Data refreshed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to refresh data.'));
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
                <p className="text-gray-700 mt-1">{user?.name}</p>
              </div>
              <button onClick={handleRefreshData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm" title="Refresh data">
                <IoReloadCircle className="text-lg" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2"><IoCheckmarkCircle className="text-lg"/>{success}</div>
              <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800"><IoCloseOutline className="w-5 h-5" /></button>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2"><IoWarningOutline className="text-lg"/>{error}</div>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800"><IoCloseOutline className="w-5 h-5" /></button>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/50 p-6">
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-2 -mb-px">
                <button onClick={() => handleTabChange(0)} className={`px-4 py-3 rounded-t-lg flex items-center space-x-2 transition-colors ${ currentTab === 0 ? 'bg-white border-t border-l border-r border-gray-200 text-[#0B95D6] font-semibold' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent' }`}><IoTimeOutline className="text-lg" /><span>Pending Approvals</span></button>
                <button onClick={() => handleTabChange(1)} disabled={!user?.linkedInstitution} className={`px-4 py-3 rounded-t-lg flex items-center space-x-2 transition-colors ${ currentTab === 1 ? 'bg-white border-t border-l border-r border-gray-200 text-[#0B95D6] font-semibold' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed' }`}><IoCloudUploadOutline className="text-lg" /><span>Log Spending</span></button>
                <button onClick={() => handleTabChange(2)} disabled={!user?.linkedInstitution} className={`px-4 py-3 rounded-t-lg flex items-center space-x-2 transition-colors ${ currentTab === 2 ? 'bg-white border-t border-l border-r border-gray-200 text-[#0B95D6] font-semibold' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed' }`}><IoStatsChartOutline className="text-lg" /><span>Institution Analytics</span></button>
              </div>
            </div>

            {currentTab === 0 && (
              <div className="pt-4">
                {isDataLoading ? (
                  <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {pendingTransactions.length > 0 ? (
                        <div className="space-y-4">
                          {pendingTransactions.map((transaction) => (
                            <div key={transaction._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-blue-300 hover:shadow-md">
                              <div className="p-5">
                                <div className="flex justify-between items-start mb-3"><h3 className="text-lg font-semibold text-gray-900">{transaction.description}</h3><p className="text-lg font-semibold text-[#0B95D6]">${transaction.amount.toLocaleString()}</p></div>
                                <p className="text-gray-600">From: <span className="font-medium text-gray-900">{transaction.institution.name}</span></p>
                              </div>
                              <div className="bg-gray-50 px-5 py-4 flex justify-end space-x-3">
                                <button onClick={() => handleVerifyTransaction(transaction._id, 'disputed')} disabled={!!actionInProgress} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"><IoCloseCircle className="text-lg" /><span>Dispute</span></button>
                                <button onClick={() => handleVerifyTransaction(transaction._id, 'completed')} disabled={!!actionInProgress} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                                  {actionInProgress === transaction._id ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div><span>Processing...</span></>) : (<><IoCheckmarkCircle className="text-lg" /><span>Approve</span></>)}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        error ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center"><IoWarningOutline className="text-5xl text-red-400 mx-auto mb-4" /><h3 className="text-xl font-semibold text-red-800 mb-2">Could Not Load Approvals</h3><p className="text-red-600">{error}</p></div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center"><IoCheckmarkCircleOutline className="text-5xl text-blue-400 mx-auto mb-4" /><h3 className="text-xl font-semibold text-blue-900 mb-2">All Clear!</h3><p className="text-blue-700">You have no pending transactions to review.</p></div>
                        )
                      )}
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><IoBusinessOutline className="mr-2 text-[#0B95D6]" />Your Department ID</h3><div className="border-t border-gray-200 my-4"></div><div onClick={handleCopyToClipboard} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"><span className="text-gray-900 font-mono truncate">{user?.departmentId || 'Not available'}</span><IoCopyOutline className="text-gray-500 group-hover:text-gray-700 ml-2 transition-colors" /></div><p className="text-xs text-gray-500 mt-2 text-center">Click to copy to clipboard</p></div>
                      <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm"><h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><IoBusinessOutline className="mr-2 text-[#0B95D6]" />Peer Departments</h3><div className="border-t border-gray-200 my-4"></div><div className="max-h-80 overflow-y-auto">{linkedDepartments.length > 0 ? (<ul className="space-y-2">{linkedDepartments.map(dept => (<li key={dept._id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"><IoBusinessOutline className="text-blue-500" /><span className="text-blue-800">{dept.name}</span></li>))}</ul>) : (<p className="text-gray-500 text-center py-4">No other linked departments found.</p>)}</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentTab === 1 && (
              <div className="pt-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Your Department's Spending Reports</h2>
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><IoAdd className="text-lg" /><span>Upload New Report</span></button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
                  <IoDocumentTextOutline className="text-5xl text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Manage Spending</h3>
                  <p className="text-blue-700">Upload CSV or PDF files of your expenses to add them to the institution's financial flowchart.</p>
                </div>
              </div>
            )}

            {currentTab === 2 && (
              <div className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1"><div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm h-full"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><IoDocumentTextOutline className="mr-2 text-[#0B95D6]" />Institution Reports</h3>{isAnalyticsLoading ? (<div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>) : (<div className="max-h-[600px] overflow-y-auto">{reports.length > 0 ? (<ul className="space-y-2">{reports.map(report => (<li key={report._id}><button onClick={() => handleSelectReport(report)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedReport?._id === report._id ? 'bg-blue-50 border border-blue-200 text-[#0B95D6]' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}><IoDocumentTextOutline className="text-lg" /><div><div className="font-medium">{report.name}</div><div className="text-xs text-gray-500">{new Date(report.reportDate).toLocaleDateString()}</div></div></button></li>))}</ul>) : (<p className="text-gray-500 text-center py-4">No reports found.</p>)}</div>)}</div></div>
                  <div className="lg:col-span-3"><div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm min-h-[600px]"><h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}</h2>{!selectedReport ? (<div className="flex flex-col justify-center items-center h-96 text-gray-400"><IoStatsChartOutline className="text-5xl mb-4 text-blue-400" /><h3 className="text-lg mb-2 text-gray-500">Select a report from the list</h3><p>View detailed analytics and visualizations.</p></div>) : isAnalyticsLoading ? (<div className="flex justify-center items-center h-96"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div><p className="mt-4 text-gray-600">Loading analytics...</p></div></div>) : analyticsData ? (<div className="space-y-6 mt-4"><div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-[450px]"><h3 className="text-lg font-semibold text-gray-900 mb-4">Fund Flow</h3><SankeyChart data={analyticsData.flowchart} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-[400px]"><h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Department</h3><DepartmentPieChart data={analyticsData.departmentShare} /></div><div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-[400px]"><h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trend</h3><SpendingTrendChart data={analyticsData.spendingTrend} groupBy={trendGroupBy} handleFilterChange={handleTrendFilterChange} /></div></div></div>) : (<div className="text-center py-12 text-gray-400">Could not load analytics data.</div>)}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative transition-transform duration-300 ${isModalOpen ? 'scale-100' : 'scale-95'}`}>
          <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><IoCloseOutline className="w-6 h-6" /></button>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Department Spending</h2>
          <form onSubmit={handleUploadSpendingReport}>
            <div className="mb-4"><label className="block text-gray-700 text-sm font-medium mb-2">Report Name</label><input type="text" placeholder="e.g., Q4 Vendor Expenses" value={newReportName} onChange={e => setNewReportName(e.target.value)} className="w-full text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required /></div>
            <div className="mb-6"><label className="block text-gray-700 text-sm font-medium mb-2">Transaction File</label><label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"><IoCloudUploadOutline className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm text-gray-500">{selectedFile ? selectedFile.name : 'Click to upload CSV or PDF file'}</span><input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} accept=".csv,.pdf" /></label></div>
            <div className="flex justify-end gap-3"><button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors">Submit Report</button></div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DepartmentDashboard;