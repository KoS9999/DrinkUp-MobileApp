const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountValue: { type: Number, required: true },
  expirationDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Coupon', CouponSchema);
