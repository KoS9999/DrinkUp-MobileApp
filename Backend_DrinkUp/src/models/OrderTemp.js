const mongoose = require('mongoose');

const OrderTempSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apptransid: { type: String, required: true, unique: true },
  totalPrice: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  orderType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['zalopay'],
    default: 'zalopay',
  },
  couponCode: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  pickupTime: { type: String },
  deliveryAddress: { type: String },
  note: { type: String },
  orderDetails: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    size: { type: String, enum: ['S', 'M', 'L'], required: true },
    iceLevel: { type: String, required: true },
    sweetLevel: { type: String, required: true },
    toppings: [{
      toppingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topping' },
      name: String,
      price: Number,
      quantity: Number,
    }],
    price: { type: Number, required: true },
    toppingsPrice: { type: Number, default: 0 },
  }],
  zaloPayData: {
    orderurl: { type: String, required: true },
    zptranstoken: { type: String, required: true },
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 20 * 60 * 1000), index: { expires: '1200s' } },
}, { timestamps: true });

module.exports = mongoose.model('OrderTemp', OrderTempSchema);