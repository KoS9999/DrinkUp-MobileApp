const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  distance: { type: Number }, 
  finalPrice: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ['new', 'processing', 'confirmed', 'shipped', 'delivered', 'canceled', 'cancel_request'],
    default: 'new'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'zalopay'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  couponCode: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, 
  pickupTime: { type: Date },
  deliveryAddress: { type: String },
  estimatedDeliveryTime: { type: Date }, 
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OrderSchema.pre('save', function (next) {
  if (this.orderType === 'pickup' && !this.branchId) {
    return next(new Error('Pickup orders must include branchId'));
  }
  if (this.orderType === 'delivery' && (!this.deliveryAddress || !this.branchId)) {
    return next(new Error('Delivery orders must include deliveryAddress and branchId'));
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);