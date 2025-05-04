const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');
const OrderDetail = require('../models/OrderDetail');
const User = require('../models/User');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const OrderTemp = require('../models/OrderTemp');

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

    if (!points || points < 1000 || points % 1000 !== 0) {
      return res.status(400).json({ error: "Số điểm quy đổi phải là bội số của 1000" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    if (points > user.points) {
      return res.status(400).json({ error: `Bạn chỉ có ${user.points} điểm` });
    }

    const discountValue = Math.floor(points / 1000) * 5000;

    return res.status(200).json({
      success: true,
      discountValue,
      availablePoints: user.points,
      estimatedRemainingPoints: user.points - points,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý quy đổi điểm:", error);
    return res.status(500).json({ error: "Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau." });
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

    const { orderType, branchId, deliveryAddress, couponCode, paymentMethod, note, redeemPoints } = req.body;

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

    const discountValueFromPoints = Math.floor(redeemPoints / 1000) * 5000; 
    const finalPrice = Math.max(0, totalPrice - discountPrice - discountValueFromPoints); 

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    if (redeemPoints > user.points) {
      return res.status(400).json({ error: "Bạn không đủ điểm để quy đổi" });
    }

    user.points -= redeemPoints; 
    await user.save();

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

const config = {
  appId: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  sandboxEndpoint: "https://sandbox.zalopay.com.vn/v001/tpe/createorder",
  callbackUrl: "https://c4fd-171-252-153-252.ngrok-free.app/api/order/zalopay-callback"
};

exports.createZalopayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderType, branchId, deliveryAddress, couponCode, redeemPoints } = req.body;

    // Lấy và validate giỏ hàng
    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .populate('items.toppings.toppingId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    // Tính toán giá
    let totalPrice = cart.items.reduce((sum, item) => {
      const basePrice = item.productId.price[item.size] || 0;
      const toppingsPrice = item.toppings.reduce((tSum, topping) => 
        tSum + (topping.toppingId.price * topping.quantity), 0);
      return sum + (basePrice + toppingsPrice) * item.quantity;
    }, 0);

    // Xử lý coupon
    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon || coupon.expirationDate < new Date()) {
        return res.status(400).json({ error: "Mã giảm giá không hợp lệ" });
      }
      discountPrice = coupon.discountValue;
    }

    // Xử lý điểm
    let pointsDiscount = 0;
    const user = await User.findById(userId);
    if (redeemPoints > 0) {
      if (redeemPoints > user.points) {
        return res.status(400).json({ error: "Không đủ điểm" });
      }
      pointsDiscount = Math.floor(redeemPoints / 1000) * 5000;
    }

    const finalPrice = Math.max(0, totalPrice - discountPrice - pointsDiscount);

    // Tạo transaction ID
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const apptransid = `${yymmdd}_${uuidv4().replace(/-/g, '').slice(0, 18)}`;

    // Tạo dữ liệu cho ZaloPay
    const embeddata = JSON.stringify({
      redirecturl: `${config.callbackUrl}`,
      merchantinfo: "CoffeeHub Order"
    });

    const items = cart.items.map(item => ({
      itemid: item.productId._id.toString(),
      itemname: item.productId.name,
      itemprice: item.productId.price[item.size],
      itemquantity: item.quantity
    }));

    // Tính MAC
    const appid = config.appId;
    const apptime = Date.now();
    const appuser = userId.toString();
    
    const rawData = [
      appid,
      apptransid,
      appuser,
      finalPrice,
      apptime,
      embeddata,
      JSON.stringify(items)
    ].join('|');

    const mac = crypto.createHmac('sha256', config.key1)
                     .update(rawData)
                     .digest('hex');

    // Lưu tạm đơn hàng
    const tempOrder = new OrderTemp({
      apptransid,
      userId,
      cart: cart.toObject(),
      totalPrice,
      finalPrice,
      discountPrice,
      pointsUsed: redeemPoints,
      couponCode,
      orderType,
      branchId,
      deliveryAddress,
      expiresAt: new Date(Date.now() + 15*60*1000) // 15 phút
    });
    await tempOrder.save();

    // Gọi API ZaloPay
    const response = await axios.post(config.sandboxEndpoint, {
      appid,
      apptransid,
      appuser,
      apptime,
      amount: finalPrice,
      embeddata,
      item: JSON.stringify(items),
      description: `CoffeeHub - Thanh toán đơn hàng #${apptransid}`,
      mac,
      bankcode: "zalopayapp"
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.returncode !== 1) {
      await OrderTemp.deleteOne({ apptransid });
      return res.status(400).json({
        error: "Tạo đơn hàng thất bại",
        detail: response.data
      });
    }

    res.json({
      orderUrl: response.data.orderurl,
      apptransid,
      amount: finalPrice,
      expiresAt: tempOrder.expiresAt
    });

  } catch (error) {
    console.error('Lỗi tạo đơn ZaloPay:', error);
    res.status(500).json({ 
      error: "Lỗi hệ thống", 
      detail: error.message 
    });
  }
};

exports.zaloPayCallback = async (req, res) => {
  try {
    // Check if data and mac exist in the request body
    if (!req.body.data || !req.body.mac) {
      console.error('Missing data or mac in callback request:', req.body);
      return res.status(400).json({
        returncode: -1,
        returnmessage: "Missing required parameters"
      });
    }
    console.log('Received ZaloPay callback body:', req.body);
    const { data, mac } = req.body;
    
    // Verify MAC
    const computedMac = crypto.createHmac('sha256', config.key2)
                            .update(data)
                            .digest('hex');

    if (computedMac !== mac) {
      console.warn('MAC không hợp lệ:', { computedMac, receivedMac: mac });
      return res.status(403).json({
        returncode: -1,
        returnmessage: "Invalid MAC"
      });
    }

    const result = JSON.parse(data);
    if (result.returncode !== 1) {
      return res.json({ 
        returncode: 3,
        returnmessage: "Thanh toán thất bại" 
      });
    }

    // Lấy thông tin từ callback
    const { 
      apptransid,
      zptransid,
      amount,
      servertime 
    } = result;

    // Kiểm tra trùng lặp
    const existingOrder = await Order.findOne({ paymentTransId: zptransid });
    if (existingOrder) {
      return res.json({ 
        returncode: 2,
        returnmessage: "Giao dịch trùng lặp" 
      });
    }

    // Lấy thông tin đơn tạm
    const tempOrder = await OrderTemp.findOne({ apptransid });
    if (!tempOrder) {
      return res.json({ 
        returncode: -2,
        returnmessage: "Đơn hàng không tồn tại" 
      });
    }

    // Kiểm tra số tiền
    if (amount !== tempOrder.finalPrice) {
      console.warn('Số tiền không khớp:', { received: amount, expected: tempOrder.finalPrice });
      return res.json({ 
        returncode: -3,
        returnmessage: "Số tiền không hợp lệ" 
      });
    }

    // Tạo đơn hàng thật
    const newOrder = new Order({
      user: tempOrder.userId,
      items: tempOrder.cart.items,
      totalPrice: tempOrder.totalPrice,
      finalPrice: tempOrder.finalPrice,
      discountPrice: tempOrder.discountPrice,
      pointsUsed: tempOrder.pointsUsed,
      paymentStatus: 'paid',
      paymentMethod: 'zalopay',
      paymentTransId: zptransid,
      orderType: tempOrder.orderType,
      branchId: tempOrder.branchId,
      deliveryAddress: tempOrder.deliveryAddress,
      status: 'confirmed'
    });

    await newOrder.save();

    // Tạo Order Details
    for (const item of tempOrder.cart.items) {
      const orderDetail = new OrderDetail({
        orderId: newOrder._id,
        product: item.productId,
        quantity: item.quantity,
        size: item.size,
        iceLevel: item.iceLevel,
        sweetLevel: item.sweetLevel,
        toppings: item.toppings,
        price: item.productId.price[item.size],
        toppingsPrice: item.toppings.reduce((sum, t) => sum + (t.toppingId.price * t.quantity), 0)
      });
      await orderDetail.save();
    }

    // Cập nhật điểm cho user
    if (tempOrder.pointsUsed > 0) {
      await User.findByIdAndUpdate(tempOrder.userId, {
        $inc: { points: -tempOrder.pointsUsed }
      });
    }

    // Xóa dữ liệu tạm
    await OrderTemp.deleteOne({ apptransid });
    await Cart.deleteOne({ userId: tempOrder.userId });

    // Gửi thông báo
    // ... (implement notification logic)

    res.json({
      returncode: 1,
      returnmessage: "Thành công"
    });

  } catch (error) {
    console.error('Lỗi xử lý callback:', error);
    res.json({
      returncode: 0,
      returnmessage: "Lỗi hệ thống"
    });
  }
};