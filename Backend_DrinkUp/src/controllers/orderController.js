const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');

exports.createOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderType, branchId, pickupTime, deliveryAddress, estimatedDeliveryTime, couponCode } = req.body;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountPrice = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon) {
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }

      if (coupon.expirationDate < new Date()) {
        return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
      }

      discountPrice = coupon.discountValue;
    }

    const finalPrice = Math.max(0, totalPrice - discountPrice); 

    if (orderType === 'pickup' && !branchId) {
      return res.status(400).json({ error: 'Vui lòng chọn chi nhánh để lấy hàng' });
    }
    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ error: 'Vui lòng nhập địa chỉ giao hàng' });
    }

    const newOrder = new Order({
      user: userId,
      totalPrice,
      discountPrice,
      finalPrice,
      orderStatus: 'new',
      paymentStatus: 'unpaid', 
      paymentMethod: 'cod', 
      orderType,
      couponCode,
      branchId,
      pickupTime,
      deliveryAddress,
      estimatedDeliveryTime
    });

    await newOrder.save();

    await Cart.findOneAndDelete({ userId });

    res.status(201).json({ message: 'Đơn hàng COD đã được tạo', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo đơn hàng COD' });
  }
};
