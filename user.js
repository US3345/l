// ============================================================
// USER MODEL - Database Schema Definition
// ============================================================
// This file defines the structure of a "User" document in MongoDB
// Think of it like a template that defines what fields users have
// ============================================================

const mongoose = require('mongoose');

// ============================================================
// USER SCHEMA
// ============================================================
// A schema is like a blueprint that describes the structure
// of documents in a MongoDB collection

const userSchema = new mongoose.Schema(
  {
    // Name field
    name: {
      type: String,           // Data type: String (text)
      required: [true, 'Name is required'],  // Must provide a name
      trim: true,             // Remove whitespace from start/end
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },

    // Email field
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,        // Convert to lowercase
      unique: true,           // No duplicate emails allowed
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },

    // Phone field (optional)
    phone: {
      type: String,
      trim: true,
      default: null,          // Optional field
      match: [
        /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
        'Please provide a valid phone number'
      ]
    },

    // Created At timestamp (automatically set)
    createdAt: {
      type: Date,
      default: Date.now       // Automatically set to current time
    },

    // Updated At timestamp (automatically updated on save)
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true          // Automatically manage createdAt and updatedAt
  }
);

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================
// This function runs BEFORE saving a user to the database
// It's like a quality check before data enters MongoDB

userSchema.pre('save', function(next) {
  // Update the updatedAt field every time we save
  this.updatedAt = Date.now();
  next();
});

// ============================================================
// CREATE AND EXPORT USER MODEL
// ============================================================
// A model is the actual class we use to interact with MongoDB
// It uses the schema to know what fields are allowed

// Create model: 'User' is singular, MongoDB will create 'users' collection
const User = mongoose.model('User', userSchema);

// Export the User model so other files can use it
module.exports = User;

// ============================================================
// HOW THIS WORKS:
// ============================================================
// 1. When you create a new user: new User({ name: 'John', email: 'john@example.com' })
// 2. The schema validates the data
// 3. The model saves it to MongoDB 'users' collection
// 4. MongoDB automatically creates unique IDs for each user
// 5. Timestamps are automatically managed
// ============================================================
