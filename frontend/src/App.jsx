// src/App.jsx - UPDATED for Homepage Flow
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// --- Layout & Page Imports ---
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
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
          <Route path="/login" element={<div>Login Page Placeholder</div>} />
          <Route path="/register" element={<div>Register Page Placeholder</div>} />

          {/* Private/Protected Route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>Dashboard Placeholder</div>
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;