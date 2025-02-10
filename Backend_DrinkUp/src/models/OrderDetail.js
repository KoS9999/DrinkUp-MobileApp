const mongoose = require('mongoose');

const OrderDetailSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  size: { type: String, enum: ['S', 'M', 'L'], required: true },
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
  price: { type: Number, required: true }
});

module.exports = mongoose.model('OrderDetail', OrderDetailSchema);
