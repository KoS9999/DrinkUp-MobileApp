const mongoose = require('mongoose');

const OrderTempSchema = new mongoose.Schema({
  apptransid: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  cart: { type: Object, required: true },
  totalPrice: Number,
  finalPrice: Number,
  discountPrice: Number,
  pointsUsed: Number,
  couponCode: String,
  orderType: String,
  branchId: mongoose.Schema.Types.ObjectId,
  deliveryAddress: String,
  expiresAt: { type: Date, index: { expires: 0 } }
});

module.exports = mongoose.model('OrderTemp', OrderTempSchema);