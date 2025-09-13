const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const InstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide institution name'],
    unique: true,
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
  // An array of references to the Department documents linked to this institution
  linkedDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }]
});

// Middleware to hash the password before saving the document
InstitutionSchema.pre('save', async function (next) {
  // This check prevents re-hashing if the password hasn't been modified
  if (!this.isModified('password')) return next();;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare passwords during login
InstitutionSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('Institution', InstitutionSchema);