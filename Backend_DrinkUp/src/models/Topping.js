const mongoose = require('mongoose');

const ToppingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

module.exports = mongoose.model('Topping', ToppingSchema);
