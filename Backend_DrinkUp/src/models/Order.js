const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ['new', 'processing', 'confirmed', 'shipped', 'delivered', 'canceled'],
    default: 'new'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  orderType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, 
  pickupTime: { type: Date }, 
  deliveryAddress: { type: String }, 
  estimatedDeliveryTime: { type: Date }, 
  createdAt: { type: Date, default: Date.now }
});

// Middleware kiểm tra tính hợp lệ
OrderSchema.pre('save', function (next) {
  if (this.orderType === 'pickup' && !this.branchId) {
    return next(new Error('Pickup orders must include branchId'));
  }
  if (this.orderType === 'delivery' && !this.deliveryAddress) {
    return next(new Error('Delivery orders must include deliveryAddress'));
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
