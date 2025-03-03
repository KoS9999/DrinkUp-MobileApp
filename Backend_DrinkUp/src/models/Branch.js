const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  address: { type: String, required: true }, 
  phone: { type: String, required: true }, 
  openingHours: { type: String, required: true }, 
  status: {
    type: String,
    enum: ['open', 'closed'], 
    default: 'open'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Branch', BranchSchema);
