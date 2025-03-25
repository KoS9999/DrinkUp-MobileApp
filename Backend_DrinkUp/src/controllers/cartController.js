const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Topping = require('../models/Topping');

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

    // if (!cart) {
    //   console.log('Không tìm thấy giỏ hàng');
    //   return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    // }

    console.log('Cart data:', cart);

    res.status(200).json(cart);
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng', details: error.message });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity, size, toppings, iceLevel, sweetLevel } = req.body;
  const userId = req.userId;

  try {
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const toppingObjectIds = Array.isArray(toppings) ? toppings.map(topping => ({
      toppingId: new mongoose.Types.ObjectId(topping.toppingId),
      quantity: topping.quantity
    })) : [];

    const product = await Product.findById(productObjectId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const price = product.price[size];
    if (!price) {
      return res.status(400).json({ message: 'Size không hợp lệ' });
    }

    let cart = await Cart.findOne({ userId });
    let addedItem = null;

    if (cart) {
      const existingItem = cart.items.find(item =>
        item.productId.equals(productObjectId) &&
        item.size === size &&
        item.iceLevel === iceLevel &&
        item.sweetLevel === sweetLevel &&
        item.toppings.length === toppings.length &&
        item.toppings.map(t => t.toppingId.toString()).sort().join(',') ===
        toppings.map(t => t.toppingId.toString()).sort().join(',')
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        addedItem = existingItem;
      } else {
        addedItem = {
          productId: productObjectId,
          quantity,
          size,
          toppings: toppingObjectIds,
          iceLevel,
          sweetLevel
        };
        cart.items.push(addedItem);
      }
    } else {
      addedItem = {
        productId: productObjectId,
        quantity,
        size,
        toppings: toppingObjectIds,
        iceLevel,
        sweetLevel
      };
      cart = new Cart({
        userId,
        items: [addedItem]
      });
    }
    await cart.save();

    // Populate để lấy thông tin chi tiết sản phẩm và topping
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name imageUrl price')
      .populate({
        path: 'items.toppings',
        populate: {
          path: 'toppingId',
          select: 'name price'
        }
      })
      .exec();

    // Lấy thông tin chi tiết của sản phẩm vừa thêm vào giỏ hàng
    const addedProduct = await Product.findById(addedItem.productId).select('name price');
    const addedToppings = await Promise.all(addedItem.toppings.map(async topping => {
      const toppingData = await Topping.findById(topping.toppingId).select('name price');
      return { name: toppingData.name, price: toppingData.price, quantity: topping.quantity };
    }));

    console.log('📦 Sản phẩm mới được thêm vào giỏ hàng:');
    console.log(`- Tên sản phẩm: ${addedProduct.name}`);
    console.log(`- Kích thước: ${size}`);
    console.log(`- Giá: ${addedProduct.price[size]} VND`);
    console.log(`- Số lượng: ${addedItem.quantity}`);
    console.log(`- Độ đá: ${iceLevel}`);
    console.log(`- Độ ngọt: ${sweetLevel}`);
    console.log('- Topping:');
    addedToppings.forEach(topping => {
      console.log(`  + ${topping.name}: ${topping.price} VND x ${topping.quantity}`);
    });

    res.status(201).json(populatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.removeFromCart = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.userId;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    const objectId = new mongoose.Types.ObjectId(itemId);

    const itemIndex = cart.items.findIndex(item => item._id.equals(objectId));
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    //Xóa sản phẩm khỏi giỏ hàng
    cart.items.splice(itemIndex, 1);

    // Nếu giỏ hàng trống, xóa luôn giỏ hàng
    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.status(200).json({ message: 'Giỏ hàng đã được xóa' });
    } else {
      await cart.save();
    }

    res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.userId;
  const { quantity } = req.body;
  try {
    // Tìm giỏ hàng
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Số lượng không hợp lệ!" });
    }
    //TEST LAI CHO NAY
    const objectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : itemId;
    console.log("item._id: ", objectId);

    // Cập nhật số lượng của sản phẩm
    const itemIndex = cart.items.findIndex(item => item._id.equals(objectId));
    console.log("itemIndex: ", itemIndex);

    if (itemIndex === -1) {
      console.warn("⚠️ Không tìm thấy sản phẩm trong giỏ hàng!");
      return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    // const itemIndex = cart.items.findIndex(item => item._id.equals(objectId));
    

    // if (itemIndex === -1) {
    //   console.warn("⚠️ Không tìm thấy sản phẩm trong giỏ hàng!");
    //   return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng!" });
    // }
  
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    res.status(200).json({ message: "Cập nhật số lượng thành công!", cart });

  } catch (error) {
    console.error("Lỗi cập nhật số lượng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
}

// exports.updateCart = async (req, res) => {
//   try {
//     const { userId, productId, size, quantity } = req.body;

//     let cart = await Cart.findOne({ userId });
//     if (!cart) return res.status(404).json({ error: 'Giỏ hàng không tồn tại' });

//     const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
//     if (itemIndex > -1) {
//       cart.items[itemIndex].quantity = quantity;
//       if (quantity === 0) {
//         cart.items.splice(itemIndex, 1);
//       }
//     }

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     res.status(500).json({ error: 'Lỗi khi cập nhật giỏ hàng' });
//   }
// };


// exports.clearCart = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     await Cart.findOneAndDelete({ userId });
//     res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
//   } catch (error) {
//     res.status(500).json({ error: 'Lỗi khi xóa giỏ hàng' });
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

