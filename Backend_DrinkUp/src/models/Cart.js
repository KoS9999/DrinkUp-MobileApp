const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      size: { type: String, enum: ['S', 'M', 'L'], required: true }, 
      toppings: [
        {
          toppingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }, 
          quantity: { type: Number, default: 1 } 
        }
      ],
      iceLevel: { 
        type: String,
        enum: ['Không đá', 'Ít đá', 'Đá bình thường', 'Đá riêng'],
        default: 'Đá bình thường'
      },
      sweetLevel: { 
        type: String,
        enum: ['Không ngọt', 'Ít ngọt', 'Ngọt bình thường', 'Nhiều ngọt'],
        default: 'Ngọt bình thường'
      }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

// CartSchema.pre('save', async function (next) {
//   try {
//     for (let item of this.items) {
//       const product = await mongoose.model('Product').findById(item.productId);
//       if (product && product.price[item.size]) {
//         const price = product.price[item.size]; 
//         item.totalPrice = item.quantity * price;
//       } else {
//         item.totalPrice = 0;  
//       }
//     }
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

CartSchema.statics.getCartByUserId = async function (userId) {
  return await this.findOne({ userId })
    .populate('items.productId', 'name imageUrl price')
    .populate('items.toppings.toppingId', 'name price')
    .exec();
};

// CartSchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     if (docToUpdate) {
//       for (let item of docToUpdate.items) {
//         const product = await mongoose.model('Product').findById(item.productId);
//         if (product) {
//           const price = product.price[item.size] || 0;
//           item.totalPrice = item.quantity * price;
//         }
//       }
//       docToUpdate.updatedAt = Date.now();
//       await docToUpdate.save();
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.model('Cart', CartSchema);
