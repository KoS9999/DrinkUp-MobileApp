const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: {
    S: { type: Number, required: true },
    M: { type: Number, required: true },
    L: { type: Number, required: true },
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  imageUrl: { type: String },
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
