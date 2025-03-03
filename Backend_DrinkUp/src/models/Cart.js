const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      size: { type: String, enum: ['S', 'M', 'L'], required: true },
      toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
      price: { type: Number, required: true }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

CartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', CartSchema);
