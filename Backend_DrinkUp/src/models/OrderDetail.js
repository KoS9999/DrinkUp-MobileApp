const mongoose = require('mongoose');

const OrderDetailSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  size: { type: String, enum: ['S', 'M', 'L'], required: true },
  iceLevel: { type: String, required: true }, 
  sweetLevel: { type: String, required: true }, 
  toppings: [
    {
      _id: false,
      toppingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topping' },
      name: String, 
      price: Number, 
      quantity: Number, 
    }
  ],
  price: { type: Number, required: true },
  toppingsPrice: { type: Number, default: 0 }, 
});

module.exports = mongoose.model('OrderDetail', OrderDetailSchema);
