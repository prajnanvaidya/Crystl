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
  FaSpinner
} from 'react-icons/fa';

// Import Chart Components
import SankeyChart from '../components/charts/SankeyChart';
import DepartmentPieChart from '../components/charts/DepartmentPieChart';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';

// Import the new Floating Chatbot
import FloatingChatbotPublic from '../components/chatbot/FloatingChatbotPublic';

const PublicInstitutionPage = () => {
  // Anomaly section state
  const [anomalies, setAnomalies] = useState([]);
  const { institutionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [pageData, setPageData] = useState({
    institution: null,
    departments: [],
    reports: [],
    flowchart: null,
    departmentShare: [],
    spendingTrend: [],
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trendGroupBy, setTrendGroupBy] = useState('monthly');

  // Data Fetching
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
          anomaliesPromise,
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
      {/* --- Anomaly Section --- */}
      <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 mb-8 max-w-lg">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
          <FaChartBar className="mr-2 text-red-500" />
          Spending Alerts
        </h3>
        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
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
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {pageData.institution?.name || 'Institution Overview'}
          </h1>
          <p className="text-lg text-gray-600">Public Financial Overview</p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
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

        {/* Departments and Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      </div>
      
      {/* Floating Chatbot */}
      {!isLoading && institutionId && user && (
        <FloatingChatbotPublic institutionId={institutionId} />
      )}
    </div>
  );
};

export default PublicInstitutionPage;