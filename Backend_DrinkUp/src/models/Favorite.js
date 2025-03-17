const mongoose = require('mongoose');

const FavoriteProductSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
  createdAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Favorite', FavoriteProductSchema);
