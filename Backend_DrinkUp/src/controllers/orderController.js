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
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;

    if (!couponCode) {
      return res.status(400).json({ error: "Vui lòng nhập mã giảm giá" });
    }

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    if (!coupon) {
      return res.status(400).json({ error: "Mã giảm giá không hợp lệ" });
    }

    if (coupon.expirationDate < new Date()) {
      return res.status(400).json({ error: "Mã giảm giá đã hết hạn" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.productId.price[item.size] * item.quantity),
      0
    );

    let discountPrice = coupon.discountValue;
    const finalPrice = Math.max(0, totalPrice - discountPrice);

    res.status(200).json({
      success: true,
      message: "Mã giảm giá đã được áp dụng",
      couponCode,
      discountPrice,
      finalPrice,
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi áp dụng mã giảm giá" });
  }
};


exports.createOrder = async (req, res) => {
  try {
    console.log("Nhận request đặt hàng:", req.body);

    const userId = req.user?.id;
    if (!userId) {
      console.error("Không tìm thấy userId!");
      return res.status(401).json({ error: "Người dùng chưa đăng nhập" });
    }

    const { orderType, branchId, deliveryAddress, couponCode, paymentMethod, note } = req.body;

    console.log("Dữ liệu đặt hàng:", { orderType, branchId, deliveryAddress, couponCode, paymentMethod, note });

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      console.error("Giỏ hàng trống!");
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    console.log("Giỏ hàng có:", cart.items.length, "món");

    const totalPrice = cart.items.reduce((sum, item) => sum + (item.productId.price[item.size] * item.quantity), 0);
    let discountPrice = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon) {
        console.error("Mã giảm giá không hợp lệ!");
        return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
      }
      if (coupon.expirationDate < new Date()) {
        console.error("Mã giảm giá đã hết hạn!");
        return res.status(400).json({ error: "Mã giảm giá đã hết hạn" });
      }
      discountPrice = coupon.discountValue;
    }

    const finalPrice = Math.max(0, totalPrice - discountPrice);
    console.log(`💰 Tổng tiền: ${totalPrice} - Giảm giá: ${discountPrice} = ${finalPrice}`);

    if (orderType === "pickup" && !branchId) {
      console.error("Chưa chọn chi nhánh!");
      return res.status(400).json({ error: "Vui lòng chọn chi nhánh để lấy hàng" });
    }
    if (orderType === "delivery" && !deliveryAddress) {
      console.error("Chưa nhập địa chỉ giao hàng!");
      return res.status(400).json({ error: "Vui lòng nhập địa chỉ giao hàng" });
    }

    let paymentStatus = "unpaid";
    if (paymentMethod === "cod") {
      paymentStatus = "unpaid";
    }

    const newOrder = new Order({
      user: userId,
      totalPrice,
      discountPrice,
      finalPrice,
      orderStatus: "new",
      paymentStatus,
      paymentMethod,
      orderType,
      couponCode,
      branchId,
      deliveryAddress,
      note,
    });

    await newOrder.save();
    console.log("Đơn hàng đã được tạo:", newOrder._id);

    for (const item of cart.items) {
      try {
        const orderDetail = new OrderDetail({
          orderId: newOrder._id,
          product: item.productId._id,
          quantity: item.quantity,
          size: item.size,
          toppings: item.toppings,
          price: item.productId.price[item.size],
        });
        await orderDetail.save();
      } catch (err) {
        console.error("Lỗi khi lưu chi tiết đơn hàng:", err);
      }
    }

    console.log("Chi tiết đơn hàng đã được lưu!");

    await Cart.findOneAndDelete({ userId });
    console.log("Giỏ hàng đã được xóa!");

    res.status(201).json({
      message: "Đơn hàng đã được tạo",
      order: newOrder,
      note: "Vui lòng thanh toán khi nhận hàng",
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ error: "Lỗi khi tạo đơn hàng", details: error.message });
  }
};

