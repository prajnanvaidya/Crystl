// src/App.jsx - UPDATED for Homepage Flow
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// --- Layout & Page Imports ---
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import InstitutionDashboard from './pages/InstitutionDashboard';
import RegisterPage from './pages/RegisterPage';
import DepartmentDashboard from './pages/DepartmentDashboard';
import InstitutionExplorerPage from './pages/InstitutionExplorerPage';
import PublicInstitutionPage from './pages/PublicInstitutionPage';
// import Dashboard from './pages/Dashboard';

// A simple component to protect routes
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { isLoading } = useAuth();

  // Show a global spinner while the app checks for a logged-in user
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
        {/* All routes are now nested under the Layout, so they all get the Navbar */}
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
 <Route path="/institutions" element={<InstitutionExplorerPage />} />
          <Route path="/institution/:institutionId" element={<PublicInstitutionPage />} />

          {/* Private/Protected Route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>Dashboard Placeholder</div>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/department"
            element={
              <PrivateRoute roles={['Department']}>
                <DepartmentDashboard /> {/* <--- REPLACE THE DIV WITH THE COMPONENT */}
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;