const Cart = require('../models/Cart');
const Product = require('../models/Product');
// const Topping = require('../models/Topping');

exports.getCart = async (req, res) => {
  try {
    console.log('Đã vào getCart controller');
    const userId = req.userId;

    if (!userId) {
      console.log('Không tìm thấy userId');
      return res.status(400).json({ error: 'Không tìm thấy userId' });
    }
    console.log('userId:', userId);  

    const cart = await Cart.getCartByUserId(userId);

    if (!cart) {
      console.log('Không tìm thấy giỏ hàng');
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }
    console.log('Cart data:', cart);  

    res.status(200).json(cart);
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);  
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng', details: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size, toppings } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

    const price = product.price[size];

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size, toppings, price, iceLevel, sweetLevel });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm vào giỏ hàng' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId, size } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: 'Giỏ hàng không tồn tại' });

    cart.items = cart.items.filter(item => !(item.productId.toString() === productId && item.size === size));

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { userId, productId, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: 'Giỏ hàng không tồn tại' });

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
      }
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật giỏ hàng' });
  }
};


exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.body;
    await Cart.findOneAndDelete({ userId });
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa giỏ hàng' });
  }
};

// const addToCart = async (req, res) => {
//   const { userId, productId, quantity, size, toppings, iceLevel, sweetLevel } = req.body;

//   try {
//       const product = await Product.findById(productId);
//       if (!product) {
//           return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
//       }

//       const price = product.price[size];
//       if (!price) {
//           return res.status(400).json({ message: 'Size không hợp lệ' });
//       }

//       const totalPrice = quantity * price;

//       let cart = await Cart.findOne({ userId });
//       if (cart) {
//           const existingItem = cart.items.find(item => 
//               item.productId.equals(productId) && item.size === size && 
//               item.iceLevel === iceLevel && item.sweetLevel === sweetLevel
//           );

//           if (existingItem) {
//               existingItem.quantity += quantity;
//               existingItem.totalPrice += totalPrice;
//           } else {
//               cart.items.push({
//                   productId,
//                   quantity,
//                   size,
//                   toppings,
//                   totalPrice,
//                   iceLevel,
//                   sweetLevel
//               });
//           }
//       } else {
//           cart = new Cart({
//               userId,
//               items: [{
//                   productId,
//                   quantity,
//                   size,
//                   toppings,
//                   totalPrice,
//                   iceLevel,
//                   sweetLevel
//               }]
//           });
//       }

//       await cart.save();
//       res.status(201).json(cart);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Lỗi server' });
//   }
// };

// const updateCartItem = async (req, res) => {
//   const { userId, itemId } = req.params;
//   const { quantity, size, toppings, iceLevel, sweetLevel } = req.body;

//   try {
//       const cart = await Cart.findOne({ userId });
//       if (!cart) {
//           return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
//       }

//       const item = cart.items.id(itemId);
//       if (!item) {
//           return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
//       }

//       const product = await Product.findById(item.productId);
//       if (!product) {
//           return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
//       }

//       const price = product.price[size] || product.price[item.size];
//       item.quantity = quantity || item.quantity;
//       item.size = size || item.size;
//       item.toppings = toppings || item.toppings;
//       item.iceLevel = iceLevel || item.iceLevel;
//       item.sweetLevel = sweetLevel || item.sweetLevel;
//       item.totalPrice = item.quantity * price;  // Cập nhật `totalPrice` theo số lượng mới

//       await cart.save();
//       res.json(cart);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Lỗi server' });
//   }
// };

// const removeCartItem = async (req, res) => {
//   const { userId, itemId } = req.params;

//   try {
//       const cart = await Cart.findOne({ userId });
//       if (!cart) {
//           return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
//       }

//       cart.items = cart.items.filter(item => !item._id.equals(itemId));

//       await cart.save();
//       res.json(cart);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Lỗi server' });
//   }
// };

// const clearCart = async (req, res) => {
//   const { userId } = req.params;

//   try {
//       const cart = await Cart.findOne({ userId });
//       if (!cart) {
//           return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
//       }

//       cart.items = [];
//       await cart.save();
//       res.json(cart);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Lỗi server' });
//   }
// };
