// src/services/api.js

import axios from 'axios';

// Create an Axios instance with a base URL and credentials support
const api = axios.create({
  // The base URL for all our API calls
  baseURL: 'http://localhost:5000/api/v1', // Your backend server URL

  // CRITICAL: This tells Axios to send cookies with every request
  withCredentials: true,
});

export default api;