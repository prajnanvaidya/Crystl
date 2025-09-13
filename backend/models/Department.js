const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const DepartmentSchema = new mongoose.Schema({
  // A unique, human-readable ID they will share with the institution
  // This will be generated in your controller upon registration.
  departmentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide department name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address',
    },
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  // A reference to the single Institution they are linked to.
  // This is null by default until the handshake/linking process is complete.
  linkedInstitution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  }
});

// Middleware to hash the password before saving
DepartmentSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare passwords during login
DepartmentSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('Department', DepartmentSchema);