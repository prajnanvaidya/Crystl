// src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Container } from '@mui/material';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main>
        {/* The <Outlet/> component will render the specific page component for the current route */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;