const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');
const OrderDetail = require('../models/OrderDetail');
const User = require('../models/User');
const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment');
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
  callbackUrl: "https://cc8b-171-252-153-252.ngrok-free.app/api/payments/zalopay-callback"
};

const createZaloPayOrder = async (orderInfo) => {
  const { userId, totalAmount, description, items } = orderInfo;
  
  const date = moment().format('YYMMDD');
  const apptransid = `${date}_${Date.now()}`;
  
  const embeddata = {
    merchantinfo: userId,
    promotioninfo: "",
    redirecturl: "" //URL to redirect after payment
  };
  
  const params = {
    appid: config.appId,
    appuser: userId,
    apptime: Date.now(),
    amount: totalAmount,
    apptransid: apptransid,
    embeddata: JSON.stringify(embeddata),
    item: JSON.stringify(items),
    description: description || "Thanh toán đơn hàng",
    bankcode: "zalopayapp" 
  };

  const data = config.appId + "|" + params.apptransid + "|" + params.appuser + "|" + 
               params.amount + "|" + params.apptime + "|" + params.embeddata + "|" + params.item;
  
  params.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');
  
  try {
    const response = await axios.post(config.sandboxEndpoint, new URLSearchParams(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error creating ZaloPay order:", error.response?.data || error.message);
    throw new Error("Không thể tạo giao dịch ZaloPay");
  }
};

const verifyZaloPayCallback = (data, mac) => {
  const hmac = crypto.createHmac('sha256', config.key2).update(data).digest('hex');
  return hmac === mac;
};

const checkZaloPayStatus = async (apptransid) => {
  const params = {
    appid: config.appId,
    apptransid: apptransid
  };
  
  const data = config.appId + "|" + apptransid + "|" + config.key1;
  params.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');
  
  try {
    const response = await axios.post(
      'https://sandbox.zalopay.com.vn/v001/tpe/getstatusbyapptransid', 
      new URLSearchParams(params), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error checking ZaloPay status:", error.response?.data || error.message);
    throw new Error("Không thể kiểm tra trạng thái giao dịch ZaloPay");
  }
};

exports.createZalopayOrder = async (req, res) => {
  try {
    console.log("Creating ZaloPay order...");
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Người dùng chưa đăng nhập" });
    }

    const { orderType, branchId, deliveryAddress, couponCode, note, redeemPoints } = req.body;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.toppings.toppingId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    let totalPrice = 0;
    const itemsForZaloPay = [];
    
    cart.items.forEach((item) => {
      if (!item.productId || !item.productId.price || !item.productId.price[item.size]) {
        return res.status(400).json({ error: "Lỗi dữ liệu sản phẩm trong giỏ hàng" });
      }

      const basePrice = item.productId.price[item.size] || 0;
      const toppingPrice = item.toppings.reduce((sum, topping) => {
        if (!topping.toppingId || typeof topping.toppingId.price !== "number") {
          return sum;
        }
        return sum + topping.toppingId.price * topping.quantity;
      }, 0);
      
      const itemTotal = (basePrice + toppingPrice) * item.quantity;
      totalPrice += itemTotal;
      
      itemsForZaloPay.push({
        itemid: item.productId._id.toString(),
        itemname: item.productId.name,
        itemprice: basePrice + toppingPrice,
        itemquantity: item.quantity
      });
    });

    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && coupon.expirationDate >= new Date()) {
        discountPrice = coupon.discountValue;
      } else {
        return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
      }
    }

    let discountValueFromPoints = 0;
    if (redeemPoints) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Người dùng không tồn tại" });
      }

      if (redeemPoints > user.points) {
        return res.status(400).json({ error: "Bạn không đủ điểm để quy đổi" });
      }
      
      discountValueFromPoints = Math.floor(redeemPoints / 1000) * 5000;
    }

    const finalPrice = Math.max(0, totalPrice - discountPrice - discountValueFromPoints);

    if (orderType === "pickup" && !branchId) {
      return res.status(400).json({ error: "Vui lòng chọn chi nhánh để lấy hàng" });
    }
    if (orderType === "delivery" && !deliveryAddress) {
      return res.status(400).json({ error: "Vui lòng nhập địa chỉ giao hàng" });
    }

    const tempOrder = {
      user: userId,
      totalPrice,
      discountPrice,
      finalPrice,
      orderType,
      couponCode,
      branchId,
      deliveryAddress,
      note,
      redeemPoints,
      cartItems: cart.items,
      created: new Date()
    };

    req.session = req.session || {};
    req.session.pendingOrder = tempOrder;

    const zaloPayOrder = await createZaloPayOrder({
      userId: userId,
      totalAmount: finalPrice,
      description: `Thanh toán đơn hàng ${moment().format('DDMMYYYY HH:mm')}`,
      items: itemsForZaloPay
    });

    if (zaloPayOrder.returncode !== 1) {
      return res.status(400).json({ 
        error: "Không thể tạo giao dịch ZaloPay", 
        message: zaloPayOrder.returnmessage 
      });
    }

    req.session.zaloPayTransId = zaloPayOrder.apptransid;

    res.status(200).json({
      success: true,
      message: "Đã tạo giao dịch ZaloPay thành công",
      orderData: {
        zptranstoken: zaloPayOrder.zptranstoken,
        orderurl: zaloPayOrder.orderurl,
        apptransid: zaloPayOrder.apptransid
      }
    });

  } catch (error) {
    console.error("Lỗi khi tạo giao dịch ZaloPay:", error);
    res.status(500).json({ 
      error: "Lỗi khi tạo giao dịch ZaloPay", 
      details: error.message 
    });
  }
};

exports.zaloPayCallback = async (req, res) => {
  try {
    console.log("Received ZaloPay callback:", req.body);
    
    const { data, mac } = req.body;
    
    if (!verifyZaloPayCallback(data, mac)) {
      console.error("Invalid MAC signature");
      return res.status(200).json({ 
        returncode: -1, 
        returnmessage: "Invalid MAC signature" 
      });
    }
    
    const callbackData = JSON.parse(data);
    const { appid, apptransid, apptime, amount, embeddata, item, zptransid, servertime, channel, merchantuserid } = callbackData;
    

    const userId = JSON.parse(embeddata).merchantinfo;
    
    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.toppings.toppingId");
    
    if (!cart || cart.items.length === 0) {
      console.error("Cart not found for user:", userId);
      return res.status(200).json({ 
        returncode: 0, 
        returnmessage: "Cart not found" 
      });
    }
    
    try {

      let totalPrice = 0;
      cart.items.forEach((item) => {
        const basePrice = item.productId.price[item.size] || 0;
        const toppingPrice = item.toppings.reduce((sum, topping) => {
          return sum + (topping.toppingId.price * topping.quantity);
        }, 0);
        
        totalPrice += (basePrice + toppingPrice) * item.quantity;
      });
      
      let discountPrice = 0;
      let couponCode = null;
      
      const newOrder = new Order({
        user: userId,
        totalPrice,
        discountPrice,
        finalPrice: amount, 
        orderStatus: "new",
        paymentStatus: "paid",
        paymentMethod: "zalopay",
        orderType: "delivery", 
        couponCode,
        branchId: null, 
        deliveryAddress: null, 
        note: null, 
        paymentDetails: {
          provider: "zalopay",
          transactionId: zptransid,
          apptransid: apptransid,
          amount: amount,
          time: servertime
        }
      });
      
      await newOrder.save();
      console.log("Order created:", newOrder._id);
      
      // Create order details
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
            toppingsPrice: item.toppings.reduce((sum, topping) => 
              sum + (topping.toppingId.price * topping.quantity), 0),
          });
          await orderDetail.save();
        } catch (err) {
          console.error("Error saving order detail:", err);
        }
      }
      
      // Clear cart
      await Cart.findOneAndDelete({ userId });
      
      // Return success to ZaloPay
      return res.status(200).json({
        returncode: 1,
        returnmessage: "success"
      });
      
    } catch (error) {
      console.error("Error processing ZaloPay callback:", error);
      return res.status(200).json({
        returncode: 0, // Ask ZaloPay to retry
        returnmessage: error.message
      });
    }
    
  } catch (error) {
    console.error("Error handling ZaloPay callback:", error);
    return res.status(200).json({
      returncode: 0, // Ask ZaloPay to retry
      returnmessage: "Internal server error"
    });
  }
};

// API to check ZaloPay payment status
exports.checkZaloPayStatus = async (req, res) => {
  try {
    const { apptransid } = req.params;
    
    if (!apptransid) {
      return res.status(400).json({ error: "Missing transaction ID" });
    }
    
    const status = await checkZaloPayStatus(apptransid);
    
    if (status.returncode === 1) {

      const order = await Order.findOne({ 'paymentDetails.apptransid': apptransid });
      
      if (!order) {
 
        return res.status(200).json({
          success: true,
          message: "Payment successful, but order not found",
          data: {
            paymentStatus: "paid",
            orderStatus: "not_created",
            ...status
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Payment successful",
        data: {
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          ...status
        }
      });
    } else if (status.returncode === -49) {
      return res.status(200).json({
        success: false,
        message: "Payment not completed",
        data: status
      });
    } else {
      return res.status(200).json({
        success: false,
        message: status.returnmessage,
        data: status
      });
    }
    
  } catch (error) {
    console.error("Error checking ZaloPay status:", error);
    res.status(500).json({ 
      error: "Lỗi khi kiểm tra trạng thái giao dịch ZaloPay", 
      details: error.message 
    });
  }
};