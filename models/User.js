const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Step 1: User Info
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxLength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  communication: {
    type: String,
    enum: ['SMS', 'Email', 'Phone Call', 'WhatsApp'],
    default: 'Email'
  },
  language: {
    type: String,
    // Support languages shown in the Angular form plus previous options
    enum: ['English', 'Hindi', 'Other', 'Spanish', 'French', 'Portuguese', 'हिंदी', 'தமிழ்', 'తెలుగు'],
    default: 'English'
  },

  // Step 2: Farm Info
  farmName: {
    type: String,
    trim: true,
    maxLength: [100, 'Farm name cannot exceed 100 characters']
  },
  farmLocation: {
    type: String,
    trim: true,
    maxLength: [200, 'Farm location cannot exceed 200 characters']
  },
  farmSize: {
    type: Number,
    min: [0, 'Farm size cannot be negative']
  },

  // Step 3: Crop Info
  primaryCrops: [{
    type: String,
    trim: true
  }],
  secondaryCrops: [{
    type: String,
    trim: true
  }],

  // Step 4: Equipment Info
  sprayerType: {
    type: String,
    // Allow both legacy values and those used by the Angular form
    enum: [
      'Manual', 'Battery-powered', 'Fuel-powered', 'Tractor-mounted', 'Drone',
      'Knapsack Sprayer', 'Backpack Sprayer', 'Handheld Sprayer', 'Pump Sprayer', 'Compression Sprayer', 'None',
      'Boom Sprayer', 'Airblast Sprayer', 'Drone Sprayer'
    ]
  },
  iotDevices: [{
    type: String,
    trim: true
  }],
  machinery: [{
    type: String,
    trim: true
  }],

  // Step 5: Pesticide Info
  pesticides: [{
    name: {
      type: String,
      trim: true
    },
    frequency: {
      type: String,
      enum: ['Weekly', 'Bi-weekly', 'Monthly', 'Seasonal', 'As needed']
    }
  }],
  fertilizerPreference: {
    type: String,
    // Support options used by the Angular form and legacy ones
    enum: ['Organic', 'Chemical', 'Both', 'Synthetic', 'Mixed', 'None']
  },
  monthlyExpenditure: {
    type: Number,
    min: [0, 'Monthly expenditure cannot be negative']
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);