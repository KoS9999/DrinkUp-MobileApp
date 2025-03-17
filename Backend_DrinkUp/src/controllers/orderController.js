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

exports.redeemPoints = async (req, res) => {
  try {
      const { points } = req.body;  
      const userId = req.user.id;  

      const user = await User.findById(userId);

      if (!user) {
          return res.status(400).json({ error: "Người dùng không tồn tại" });
      }

      if (user.points < points) {
          return res.status(400).json({ error: "Bạn không đủ điểm để quy đổi" });
      }

      // Tính giá trị quy đổi (1000 điểm = 5000 VND)
      const discountValue = Math.floor(points / 1000) * 5000;

      user.points -= points;
      await user.save();

      const cart = await Cart.findOne({ userId }).populate("items.productId");

      if (!cart || cart.items.length === 0) {
          return res.status(400).json({ error: "Giỏ hàng trống" });
      }

      const totalPrice = cart.items.reduce(
          (sum, item) => sum + (item.productId.price[item.size] * item.quantity),
          0
      );

      const finalPrice = Math.max(0, totalPrice - discountValue);

      res.status(200).json({
          success: true,
          message: "Điểm đã được quy đổi thành công",
          discountValue,
          finalPrice,
          remainingPoints: user.points, // Trả về số điểm còn lại
      });
  } catch (error) {
      res.status(500).json({ error: "Lỗi khi quy đổi điểm" });
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

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.toppings.toppingId");

    if (!cart || cart.items.length === 0) {
      console.error("Giỏ hàng trống!");
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    console.log("Giỏ hàng có:", cart.items.length, "món");

    let totalPrice = 0;
    cart.items.forEach((item) => {
      if (!item.productId || !item.productId.price || !item.productId.price[item.size]) {
        console.error("Lỗi: Không tìm thấy giá sản phẩm!", item);
        return res.status(400).json({ error: "Lỗi dữ liệu sản phẩm trong giỏ hàng" });
      }

      const basePrice = item.productId.price[item.size] || 0;

      const toppingPrice = item.toppings.reduce((sum, topping) => {
        if (!topping.toppingId || typeof topping.toppingId.price !== "number") {
          console.warn("Lỗi: Dữ liệu topping bị thiếu hoặc không hợp lệ:", topping);
          return sum; 
        }
        return sum + topping.toppingId.price * topping.quantity;
      }, 0);
      

      totalPrice += (basePrice + toppingPrice) * item.quantity;
    });

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
          iceLevel: item.iceLevel, 
          sweetLevel: item.sweetLevel, 
          toppings: item.toppings.map((topping) => ({
            toppingId: topping.toppingId._id,
            name: topping.toppingId.name,
            price: topping.toppingId.price,
            quantity: topping.quantity,
          })),
          price: item.productId.price[item.size], 
          toppingsPrice: item.toppings.reduce((sum, topping) => sum + (topping.toppingId.price * topping.quantity), 0), 
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
    console.error("Lỗi khi tạo đơn hàng. Vui lòng chọn phương thức thanh toán:", error);
    res.status(500).json({ error: "Lỗi khi tạo đơn hàng. Vui lòng chọn phương thức thanh toán", details: error.message });
  }
};


