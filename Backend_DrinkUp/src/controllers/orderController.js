const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');
const OrderDetail = require('../models/OrderDetail');

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ status: 'open' });
    res.status(200).json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách chi nhánh' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderType, branchId, deliveryAddress, couponCode, paymentMethod, note } = req.body;

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

    let paymentStatus = 'unpaid';
    if (paymentMethod === 'cod') {
      paymentStatus = 'pending';
    }

    const newOrder = new Order({
      user: userId,
      totalPrice,
      discountPrice,
      finalPrice,
      orderStatus: 'new',
      paymentStatus,
      paymentMethod,
      orderType,
      couponCode,
      branchId,
      deliveryAddress,
      note,
    });

    await newOrder.save();

    for (const item of cart.items) {
      const orderDetail = new OrderDetail({
        orderId: newOrder._id,
        product: item.productId._id,
        quantity: item.quantity,
        size: item.size,
        toppings: item.toppings,
        price: item.price,
      });
      await orderDetail.save();
    }

    await Cart.findOneAndDelete({ userId });

    res.status(201).json({ 
      message: 'Đơn hàng đã được tạo',
      order: newOrder,
      note: 'Vui lòng thanh toán khi nhận hàng',
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo đơn hàng' });
  }
};
