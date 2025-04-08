const mongoose = require('mongoose');

const FavoriteProductSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});


FavoriteProductSchema.statics.getFavoriteProductByUserId = async function (userId) {
  return await this.findOne({ userId })
    .populate('items.productId', '_id name description imageUrl price')
    .exec();
};

module.exports = mongoose.model('FavoriteProduct', FavoriteProductSchema);
