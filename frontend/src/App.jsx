// src/App.jsx - FINAL CORRECTED VERSION

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// --- Component and Page Imports ---
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute'; 
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InstitutionDashboard from './pages/InstitutionDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import InstitutionExplorerPage from './pages/InstitutionExplorerPage';
import PublicInstitutionPage from './pages/PublicInstitutionPage';
import UserDashboard from './pages/UserDashboard';
import ChatPage from './pages/ChatPage';
import ChatRoom from './pages/ChatRoom';
function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          {/* --- Public Routes --- */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === 'Institution' ? '/dashboard/institution' :
                    user.role === 'Department' ? '/dashboard/department' :
                    user.role === 'User' ? '/dashboard/user' :
                    '/institutions' // Safe fallback
                  }
                  replace
                />
              ) : (
                <HomePage />
              )
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/institutions" element={<InstitutionExplorerPage />} />
          <Route path="/institution/:institutionId" element={<PublicInstitutionPage />} />

          {/* --- Private Routes with PROPER Role Checking --- */}

          <Route
            path="/dashboard/department"
            element={
              <PrivateRoute roles={['Department']}>
                <DepartmentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/institution"
            element={
              <PrivateRoute roles={['Institution']}>
                <InstitutionDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/user"
            element={
              <PrivateRoute roles={['User']}>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/user/chat/:institutionId"
            element={
              <PrivateRoute roles={['User']}>
                <ChatPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <PrivateRoute roles={['User', 'Department']}>
                <ChatRoom />
              </PrivateRoute>
            }
            />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;