import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaFileAlt, 
  FaBuilding, 
  FaComments, 
  FaChartBar, 
  FaChartPie, 
  FaChartLine,
  FaSpinner,
  FaSearch
} from 'react-icons/fa';
import { useCurrency } from '../context/CurrencyContext';
// Import Chart Components
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// Import the new Floating Chatbot
import FloatingChatbotPublic from '../components/chatbot/FloatingChatbotPublic';

const PublicInstitutionPage = () => {
  const { institutionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
const { currency, toggleCurrency, formatAmount } = useCurrency();
  // State Management
  const [pageData, setPageData] = useState({
    institution: null,
    departments: [],
    reports: [],
    flowchart: null,
    departmentShare: [],
    spendingTrend: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');
  const [anomalies, setAnomalies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  // Data Fetching
  const fetchTransactions = async () => {
    try {
      const transactionsRes = await api.get(`/public/institution/${institutionId}/all-transactions?page=${currentPage}&search=${searchTerm}`);
      setTransactions(transactionsRes.data.transactions);
      setFilteredTransactions(transactionsRes.data.transactions);
      setTotalPages(transactionsRes.data.totalPages);
      setCurrentPage(transactionsRes.data.currentPage);
    } catch (err) {
      setError('Failed to load transactions');
      console.error("Transaction fetch error:", err);
    }
  };

  useEffect(() => {
    if (!institutionId) return;
    fetchTransactions();
  }, [institutionId, currentPage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!institutionId) return;
      setIsLoading(true);
      setError('');
      try {
        const detailsPromise = api.get(`/public/institution/${institutionId}/details`);
        const departmentsPromise = api.get(`/public/institution/${institutionId}/departments`);
        const reportsPromise = api.get(`/public/institution/${institutionId}/reports`);
        const anomaliesPromise = api.get(`/public/institution/${institutionId}/anomalies`);


        const [detailsRes, departmentsRes, reportsRes, anomaliesRes] = await Promise.all([
          detailsPromise,
          departmentsPromise,
          reportsPromise,
          anomaliesPromise
        ]);

        setPageData(prev => ({
          ...prev,
          institution: detailsRes.data.institution,
          departments: departmentsRes.data.departments,
          reports: reportsRes.data.reports,
        }));
        setAnomalies(anomaliesRes.data.anomalies || []);
      } catch (err) {
        setError('Failed to load institution details. This institution may not exist or have public records.');
        console.error("Initial data fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [institutionId]);

  // Handlers
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
  
  const handleTrendFilterChange = useCallback(async (newGroupBy) => {
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
  
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    if (term.length >= 3 || term.length === 0) {
      fetchTransactions();
    }
  }

  // Back button handler
  const handleBackToDashboard = () => {
    if (user && user.role) {
      const rolePathMap = {
        Institution: '/dashboard/institution',
        Department:  '/dashboard/department',
        User:        '/dashboard/user',
      };
      const target = rolePathMap[user.role] ?? '/institutions';
      navigate(target);
      return;
    }
    navigate('/login');
  };

  // Render Logic
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading institution details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !pageData.institution) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            &times;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8 gap-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {pageData.institution?.name || 'Institution Overview'}
          </h1>
          <p className="text-lg text-gray-600">Public Financial Overview</p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>
        {/* Back button*/}
        <div className="flex-shrink-0 mt-1 flex items-center gap-4">
  <button
    onClick={toggleCurrency}
    className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium bg-white border border-gray-200 text-sky-700 font-semibold"
  >
    <span>Display as: </span>
    <span className={`ml-2 px-2 py-1 rounded ${currency === 'USD' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>USD</span>
    <span className={`px-2 py-1 rounded ${currency === 'INR' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>INR</span>
  </button>

  <button
    type="button"
    onClick={handleBackToDashboard}
    aria-label="Back to Dashboard"
    className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 bg-white border border-gray-200"
  >
    <svg className="w-4 h-4 mr-2 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    <span className="text-sky-700 font-semibold">Back to Dashboard</span>
  </button>
</div>
          <div className="flex-shrink-0 mt-1">
            <button
              type="button"
              onClick={handleBackToDashboard}
              aria-label="Back to Dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 bg-white border border-gray-200"
            >
              <svg className="w-4 h-4 mr-2 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sky-700 font-semibold">Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              {error}
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              {success}
            </div>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
              &times;
            </button>
          </div>
        )}

        {/* Departments, Reports, and Alerts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Departments Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FaBuilding className="text-blue-600 mr-2 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Linked Departments</h2>
            </div>
            <div className="border-t border-gray-200 mb-4"></div>
            <div className="space-y-3">
              {pageData.departments?.length > 0 ? pageData.departments.map((dept) => (
                <div key={dept._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaBuilding className="text-gray-500 mr-3" />
                    <span className="text-gray-800">{dept.name}</span>
                  </div>
                  {user && user.role === 'User' && (
                    <button
                      onClick={() => handleStartChat(dept._id)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Start a public chat with this department"
                    >
                      <FaComments />
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No public departments found.</p>
              )}
            </div>
          </div>

          {/* Reports Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FaFileAlt className="text-blue-600 mr-2 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
            </div>
            <div className="border-t border-gray-200 mb-4"></div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {pageData.reports?.length > 0 ? pageData.reports.map((report) => (
                <button
                  key={report._id}
                  onClick={() => handleSelectReport(report)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                    selectedReport?._id === report._id
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaFileAlt className="mr-3 text-gray-500" />
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-500">
                      Date: {new Date(report.reportDate).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              )) : (
                <p className="text-gray-500 text-center py-4">No public reports available.</p>
              )}
            </div>
          </div>

          {/* Spending Alerts Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border-2 border-red-200 p-6">
            <div className="flex items-center mb-4">
              <FaChartBar className="text-red-500 mr-2 text-xl" />
              <h2 className="text-xl font-semibold text-red-700">Spending Alerts</h2>
            </div>
            <div className="border-t border-red-200 mb-4"></div>
            <div className="max-h-80 overflow-y-auto space-y-3">
              {anomalies.length > 0 ? (
                anomalies.map((anomaly) => (
                  <div key={anomaly._id} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-800">{anomaly.message}</p>
                    <p className="text-xs text-red-600 mt-1">Detected on: {new Date(anomaly.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FaChartBar className="mx-auto text-green-400 mb-2" style={{ fontSize: '2.5rem' }} />
                  <p>No spending anomalies detected. All spending is within expected limits.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Charts & Analytics Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {selectedReport ? `Analytics for "${selectedReport.name}"` : 'Report Analytics'}
          </h2>
          
          {!selectedReport ? (
            <div className="flex flex-col justify-center items-center h-96 text-gray-400">
              <FaChartBar className="text-5xl mb-4 text-blue-400" />
              <h3 className="text-xl mb-2 text-gray-500">Select a report from the list above</h3>
              <p>View detailed analytics and visualizations</p>
            </div>
          ) : isAnalyticsLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Fund Flow Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <FaChartBar className="text-blue-600 mr-2 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Fund Flow</h3>
                </div>
                {pageData.flowchart ? (
                  <SankeyChart data={pageData.flowchart} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No fund flow data available.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Spending Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-4">
                    <FaChartPie className="text-blue-600 mr-2 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Spending by Department</h3>
                  </div>
                  {pageData.departmentShare ? (
                    <DepartmentPieChart data={pageData.departmentShare} />
                  ) : (
                    <p className="text-gray-500 text-center py-8">No department spending data available.</p>
                  )}
                </div>

                {/* Spending Trend Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FaChartLine className="text-blue-600 mr-2 text-xl" />
                      <h3 className="text-lg font-semibold text-gray-900">Spending Trend</h3>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleTrendFilterChange('monthly')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          trendGroupBy === 'monthly' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => handleTrendFilterChange('quarterly')}
                        className={`px-3 py-1 ml-1 rounded-md text-sm ${
                          trendGroupBy === 'quarterly' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        Quarterly
                      </button>
                      <button
                        onClick={() => handleTrendFilterChange('annually')}
                        className={`px-3 py-1 ml-1 rounded-md text-sm ${
                          trendGroupBy === 'annually' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        Annually
                      </button>
                    </div>
                  </div>
                  {pageData.spendingTrend ? (
                    <SpendingTrendChart 
                      data={pageData.spendingTrend} 
                      groupBy={trendGroupBy} 
                      handleFilterChange={() => {}} 
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-8">No spending trend data available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Transaction Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Transactions</h2>
            <div className="mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by department, vendor, or description..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-3 pl-10 text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient/Vendor</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredTransactions.map((t) => (
                            <tr key={t._id} className="hover:bg-gray-50">
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.department?.name}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.recipient || t.vendor || 'N/A'}</td>
                                <td className="py-4 px-4 text-sm text-gray-800">{t.description}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
  {formatAmount(t.amount)}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'Allocation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {t.type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => {
                            if (currentPage > 1) {
                                setCurrentPage(prev => prev - 1);
                            }
                        }}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => {
                            if (currentPage < totalPages) {
                                setCurrentPage(prev => prev + 1);
                            }
                        }}
                        disabled={currentPage === totalPages}
                        className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => {
                                    if (currentPage > 1) {
                                        setCurrentPage(prev => prev - 1);
                                    }
                                }}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                    currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
                                }`}
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {(() => {
                                const pageNumbers = [];
                                if (totalPages <= 7) {
                                    // If total pages is 7 or less, show all pages
                                    for (let i = 1; i <= totalPages; i++) {
                                        pageNumbers.push(i);
                                    }
                                } else {
                                    // Always show first two pages
                                    pageNumbers.push(1, 2);
                                    
                                    if (currentPage <= 4) {
                                        // If current page is near the start
                                        pageNumbers.push(3, 4, 5, '...', totalPages);
                                    } else if (currentPage >= totalPages - 3) {
                                        // If current page is near the end
                                        pageNumbers.push(
                                            '...',
                                            totalPages - 4,
                                            totalPages - 3,
                                            totalPages - 2,
                                            totalPages - 1,
                                            totalPages
                                        );
                                    } else {
                                        // If current page is in the middle
                                        pageNumbers.push(
                                            '...',
                                            currentPage - 1,
                                            currentPage,
                                            currentPage + 1,
                                            '...',
                                            totalPages
                                        );
                                    }
                                }

                                return pageNumbers.map((pageNum, index) => {
                                    if (pageNum === '...') {
                                        return (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700"
                                            >
                                                ...
                                            </span>
                                        );
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                });
                            })()}
                            <button
                                onClick={() => {
                                    if (currentPage < totalPages) {
                                        setCurrentPage(prev => prev + 1);
                                    }
                                }}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                    currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

      </div>
      
      {/* Floating Chatbot */}
      {!isLoading && institutionId && user && (
        <FloatingChatbotPublic institutionId={institutionId} />
      )}
    </div>
  );
};

export default PublicInstitutionPage;