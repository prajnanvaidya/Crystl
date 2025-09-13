// app.js

// --- Core Node Modules ---
require('dotenv').config();
require('express-async-errors'); // Replaces try-catch blocks in controllers

// --- Express App Initialization ---
const express = require('express');
const app = express();

// --- Other Packages ---
const cookieParser = require('cookie-parser');
const cors = require('cors');

// --- Database Connection ---
const connectDB = require('./db/connect');

const authRouter = require('./routes/authRoutes');

// --- Middleware ---
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// --- Security & Core Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies
app.use(cookieParser(process.env.JWT_SECRET)); // Sign cookies

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('<h1>Financial Transparency API</h1>');
});

app.use('/api/v1/auth', authRouter);

// --- Error Handling Middleware (must be last) ---
app.use(notFoundMiddleware); // For routes that don't exist
app.use(errorHandlerMiddleware); // For handling all other errors

// --- Server Startup ---
const port = process.env.PORT || 5000;
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();