// app.js

// --- Core Node Modules & Configuration ---
require('dotenv').config();
require('express-async-errors'); // Must be at the top after dotenv

// --- Core Dependencies ---
const express = require('express');
const app = express();

// --- Security, Utility, and Middleware Packages ---
const morgan = require('morgan'); // For logging HTTP requests
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet'); // For setting various security headers
const rateLimiter = require('express-rate-limit'); // To prevent brute-force attacks

// --- Database Connection ---
const connectDB = require('./db/connect');

// --- Routers ---
const authRouter = require('./routes/authRoutes');
const institutionRouter = require('./routes/institutionRoutes');
const departmentRouter = require('./routes/departmentRoutes');
const publicRouter = require('./routes/publicRoutes');
const userRouter = require('./routes/userRoutes');
const chatRouter = require('./routes/chatRoutes');
const chatbotRouter = require('./routes/chatbotRoutes');
// Add other routers as you create them (e.g., flowchartRouter, userRouter)

// --- Middleware Imports ---
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// --- Security Middleware Configuration ---
// Note: In production, you'd set the origin to your frontend's actual domain.
const allowedOrigins = [
    'http://localhost:3000', // The default for create-react-app
    'http://localhost:5173' ,
    'https://crystl.vercel.app', // The default for Vite
    // Add your deployed frontend URL here later, e.g., 'https://your-app.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(helmet());
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 200, // Limit each IP to 200 requests per windowMs
//   })
// );

// --- Core Express Middleware ---
app.use(morgan('dev')); // Use morgan for logging in development
app.use(express.json()); // To parse incoming JSON payloads
app.use(cookieParser(process.env.JWT_SECRET)); // To parse signed cookies for auth

// --- API ROUTES ---
app.get('/', (req, res) => {
  res.send('<h1>Financial Transparency API</h1><p>Welcome!</p>');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/institution', institutionRouter);
app.use('/api/v1/department', departmentRouter);
app.use('/api/v1/public', publicRouter); 
app.use('/api/v1/user', userRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/chatbot', chatbotRouter);
// app.use('/api/v1/user', userRouter);
// app.use('/api/v1/public', publicRouter); // for flowchart data, etc.



// --- Custom Error Handling Middleware (must be the last middleware used) ---
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// --- Server Initialization ---
const port = process.env.PORT || 5000;
const start = async () => {
  try {
    // 1. Connect to the database
    await connectDB(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.'); // Your preferred log message

    // 2. Start the Express server only after the DB connection is successful
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.error('FATAL: Failed to connect to the database. Server is not starting.', error);
  }
};

start();