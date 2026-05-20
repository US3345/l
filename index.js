// ============================================================
// STAYORA ATLAS TESTER - Main Server File
// ============================================================
// This is the main server file that handles:
// 1. MongoDB Atlas connection
// 2. All CRUD operations (Create, Read, Update, Delete)
// 3. Route handlers
// 4. Error handling
// ============================================================

// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables from .env file
// This loads your MONGO_URL connection string
dotenv.config();

// Import the User model
const User = require('./models/user');

// Initialize Express app
const app = express();

// ============================================================
// MIDDLEWARE SETUP
// ============================================================

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Middleware to parse URL-encoded form data (from forms)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data
app.use(express.json());

// Set EJS as the view engine
// This tells Express to use .ejs files for rendering HTML
app.set('view engine', 'ejs');

// Set the views directory to ./views folder
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images, etc.) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// MONGODB ATLAS CONNECTION
// ============================================================

// Function to connect to MongoDB Atlas
const connectDB = async () => {
  try {
    // Get the MongoDB URL from environment variables
    const mongoURL = process.env.MONGO_URL;

    // Check if MONGO_URL exists
    if (!mongoURL) {
      throw new Error('MONGO_URL is not defined in environment variables');
    }

    // Connect to MongoDB Atlas using Mongoose
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    return true;

  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Error:');
    console.error(`Error Message: ${error.message}`);
    console.error('📝 Please check:');
    console.error('   1. Your MongoDB Atlas connection string in .env file');
    console.error('   2. Your IP address is whitelisted in MongoDB Atlas');
    console.error('   3. Your database user credentials are correct');
    console.error('   4. Your internet connection is active');
    return false;
  }
};

// ============================================================
// ROUTES
// ============================================================

// HOME ROUTE - Display main page
app.get('/', async (req, res) => {
  try {
    // Fetch all users from MongoDB
    const users = await User.find().lean();

    // Render the home page with users data
    res.render('home', {
      users: users || [],
      message: null,
      error: null
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('home', {
      users: [],
      message: null,
      error: 'Failed to load users from database'
    });
  }
});

// TEST CONNECTION ROUTE - Check if MongoDB is connected
app.get('/test', async (req, res) => {
  try {
    // Simple test to check MongoDB connection
    const connectionStatus = mongoose.connection.readyState;

    // readyState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const statusMap = {
      0: 'Disconnected ❌',
      1: 'Connected ✅',
      2: 'Connecting...',
      3: 'Disconnecting...'
    };

    // Get server info
    const serverStatus = await mongoose.connection.db.admin().ping();

    // Send test result as JSON
    res.json({
      success: true,
      message: 'MongoDB Atlas Test Successful!',
      connectionStatus: statusMap[connectionStatus],
      serverPing: serverStatus.ok === 1 ? 'Server is responding ✅' : 'Server error ❌',
      database: mongoose.connection.name || 'Not connected',
      host: mongoose.connection.host || 'N/A',
      timestamp: new Date().toLocaleString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MongoDB Atlas Test Failed!',
      error: error.message,
      hint: 'Check your connection string and network access',
      timestamp: new Date().toLocaleString()
    });
  }
});

// ADD USER ROUTE - Create a new user
app.post('/add', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).render('home', {
        users: await User.find().lean(),
        message: null,
        error: 'Name and email are required!'
      });
    }

    // Create a new user object
    const newUser = new User({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : ''
    });

    // Save user to MongoDB
    await newUser.save();

    console.log(`✅ New user added: ${name}`);

    // Fetch all users and show success message
    const users = await User.find().lean();
    res.render('home', {
      users: users,
      message: `✅ User "${name}" added successfully!`,
      error: null
    });

  } catch (error) {
    console.error('Error adding user:', error);

    // Check for specific validation errors
    if (error.code === 11000) {
      res.status(400).render('home', {
        users: await User.find().lean(),
        message: null,
        error: 'This email already exists in the database!'
      });
    } else if (error.name === 'ValidationError') {
      res.status(400).render('home', {
        users: await User.find().lean(),
        message: null,
        error: 'Invalid data: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    } else {
      res.status(500).render('home', {
        users: await User.find().lean(),
        message: null,
        error: 'Failed to add user to database'
      });
    }
  }
});

// GET ALL USERS ROUTE - Fetch and display all users
app.get('/users', async (req, res) => {
  try {
    // Fetch all users from MongoDB and convert to plain JavaScript objects
    const users = await User.find().lean();

    // Send users as JSON
    res.json({
      success: true,
      totalUsers: users.length,
      users: users,
      message: `Found ${users.length} user(s) in database`
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// DELETE USER ROUTE - Remove a user by ID
app.delete('/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    // Check if user was found and deleted
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User deleted: ${deletedUser.name}`);

    // Send success response
    res.json({
      success: true,
      message: `User "${deletedUser.name}" deleted successfully!`,
      deletedUser: deletedUser
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================

// Handle 404 (Not Found) errors
app.use((req, res) => {
  res.status(404).render('home', {
    users: [],
    message: null,
    error: 'Page not found (404)'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).render('home', {
    users: [],
    message: null,
    error: 'An unexpected error occurred. Please try again later.'
  });
});

// ============================================================
// START SERVER
// ============================================================

// Get port from environment or use default
const PORT = process.env.PORT || 5000;

// Start the server
const startServer = async () => {
  // First, try to connect to MongoDB
  const dbConnected = await connectDB();

  // Start Express server regardless of DB connection
  // (so we can still access /test route to debug)
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Visit http://localhost:${PORT}/test to check MongoDB connection`);
    console.log(`🏠 Visit http://localhost:${PORT} to access the main page\n`);
  });
};

// Call the start server function
startServer();

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n📴 Server shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

// Export app for potential use in other files
module.exports = app;
