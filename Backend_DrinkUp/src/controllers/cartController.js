const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId items.toppings');
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng' });
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
      cart.items.push({ productId, quantity, size, toppings, price });
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
