import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  cnicNumber: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  department: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  lastDonation: {
    type: Date,
    default: null,
  },
  nextAvailableDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Calculate next available date before saving
donorSchema.pre('save', function(next) {
  if (this.lastDonation) {
    const nextDate = new Date(this.lastDonation);
    nextDate.setMonth(nextDate.getMonth() + 3);
    this.nextAvailableDate = nextDate;
  }
  next();
});

export const Donor = mongoose.model('Donor', donorSchema); 