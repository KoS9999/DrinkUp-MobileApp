const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');
const OrderDetail = require('../models/OrderDetail');
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const OrderTemp = require('../models/OrderTemp');
const moment = require('moment-timezone');


require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ status: 'open' });
    res.status(200).json({ success: true, branches });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chi nhánh:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách chi nhánh' });
  }
};
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;

    if (!couponCode) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
    }

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) {
      return res.status(400).json({ error: 'Mã giảm giá không hợp lệ' });
    }

    if (coupon.expirationDate < new Date()) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.productId.price[item.size] * item.quantity),
      0
    );

    const discountPrice = coupon.discountValue;
    const finalPrice = Math.max(0, totalPrice - discountPrice);

    res.status(200).json({
      success: true,
      message: 'Mã giảm giá đã được áp dụng',
      couponCode,
      discountPrice,
      finalPrice,
    });
  } catch (error) {
    console.error('Lỗi khi áp dụng mã giảm giá:', error);
    res.status(500).json({ error: 'Lỗi khi áp dụng mã giảm giá' });
  }
};
exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const userId = req.user.id;

    if (!points || points < 1000 || points % 1000 !== 0) {
      return res.status(400).json({ error: 'Số điểm quy đổi phải là bội số của 1000' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    if (points > user.points) {
      return res.status(400).json({ error: `Bạn chỉ có ${user.points} điểm` });
    }

    const discountValue = Math.floor(points / 1000) * 5000;

    res.status(200).json({
      success: true,
      discountValue,
      availablePoints: user.points,
      estimatedRemainingPoints: user.points - points,
    });
  } catch (error) {
    console.error('Lỗi khi xử lý quy đổi điểm:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau.' });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.error('Không tìm thấy userId!');
      return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
    }

    const {
      orderType,
      branchId,
      deliveryAddress,
      couponCode,
      paymentMethod,
      note,
      redeemPoints,
      shippingFee,
      distance,
      estimatedDeliveryTime,
    } = req.body;

    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .populate('items.toppings.toppingId');

    if (!cart || cart.items.length === 0) {
      console.error('Giỏ hàng trống!');
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    let totalPrice = 0;
    for (const item of cart.items) {
      if (!item.productId || !item.productId.price || !item.productId.price[item.size]) {
        console.error('Lỗi: Không tìm thấy giá sản phẩm!', item);
        return res.status(400).json({ error: 'Lỗi dữ liệu sản phẩm trong giỏ hàng' });
      }

      const basePrice = item.productId.price[item.size] || 0;
      const toppingPrice = item.toppings.reduce((sum, topping) => {
        if (!topping.toppingId || typeof topping.toppingId.price !== 'number') {
          console.warn('Lỗi: Dữ liệu topping không hợp lệ:', topping);
          return sum;
        }
        return sum + topping.toppingId.price * topping.quantity;
      }, 0);

      totalPrice += (basePrice + toppingPrice) * item.quantity;
    }

    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon || coupon.expirationDate < new Date()) {
        console.error('Mã giảm giá không hợp lệ hoặc đã hết hạn!');
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }
      discountPrice = coupon.discountValue;
    }

    const discountValueFromPoints = Math.floor(redeemPoints / 1000) * 5000;
    const finalPrice = Math.max(
      0,
      totalPrice + (orderType === 'delivery' ? shippingFee : 0) - discountPrice - discountValueFromPoints
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    if (redeemPoints > user.points) {
      return res.status(400).json({ error: 'Bạn không đủ điểm để quy đổi' });
    }

    user.points -= redeemPoints;
    await user.save();

    if (orderType === 'pickup' && !branchId) {
      console.error('Chưa chọn chi nhánh!');
      return res.status(400).json({ error: 'Vui lòng chọn chi nhánh để lấy hàng' });
    }
    if (orderType === 'delivery' && (!deliveryAddress || !branchId)) {
      console.error('Chưa cung cấp địa chỉ hoặc chi nhánh giao hàng!');
      return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ và chi nhánh giao hàng' });
    }

    const paymentStatus = paymentMethod === 'cod' ? 'unpaid' : 'unpaid';

    const newOrder = new Order({
      user: userId,
      totalPrice,
      discountPrice,
      shippingFee: orderType === 'delivery' ? shippingFee : 0,
      distance: orderType === 'delivery' ? distance : null,
      finalPrice,
      orderStatus: 'new',
      paymentStatus,
      paymentMethod,
      orderType,
      couponCode,
      branchId,
      deliveryAddress,
      estimatedDeliveryTime: orderType === 'delivery' ? estimatedDeliveryTime : null,
      note,
    });

    await newOrder.save();

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
          toppingsPrice: item.toppings.reduce(
            (sum, topping) => sum + topping.toppingId.price * topping.quantity,
            0
          ),
        });
        await orderDetail.save();
      } catch (err) {
        console.error('Lỗi khi lưu chi tiết đơn hàng:', err);
      }
    }

    await Cart.findOneAndDelete({ userId });

    res.status(201).json({
      message: 'Đơn hàng đã được tạo',
      order: newOrder,
      note: 'Vui lòng thanh toán khi nhận hàng',
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    res.status(500).json({
      error: 'Lỗi khi tạo đơn hàng. Vui lòng chọn phương thức thanh toán',
      details: error.message,
    });
  }
};

exports.calculateShipping = async (req, res) => {
  try {
    const { deliveryAddress, lat, lng } = req.body;

    if (!deliveryAddress || !lat || !lng) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp địa chỉ và tọa độ' });
    }

    const branches = await Branch.find({ status: 'open' });
    if (!branches.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy chi nhánh nào đang mở' });
    }

    const origins = branches.map(branch => `${branch.coordinates.latitude},${branch.coordinates.longitude}`);
    const destination = `${lat},${lng}`;

    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.join('|')}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Distance Matrix URL:', distanceMatrixUrl); 

    const distanceResponse = await axios.get(distanceMatrixUrl);
    console.log('Distance Matrix Response:', JSON.stringify(distanceResponse.data, null, 2)); 

    if (distanceResponse.data.status !== 'OK' || !distanceResponse.data.rows) {
      console.error('Distance Matrix Error:', distanceResponse.data);
      return res.status(500).json({ success: false, error: `Lỗi khi tính toán khoảng cách: ${distanceResponse.data.status}` });
    }

    let nearestBranch = null;
    let minDistance = Infinity;
    let duration = null;

    distanceResponse.data.rows.forEach((row, index) => {
      const element = row.elements[0];
      console.log(`Branch ${index} element:`, element); 
      if (element.status === 'OK') {
        const distanceInMeters = element.distance.value;
        if (distanceInMeters < minDistance) {
          minDistance = distanceInMeters;
          nearestBranch = branches[index];
          duration = element.duration;
        }
      } else {
        console.warn(`Branch ${index} has invalid status: ${element.status}`);
      }
    });

    if (!nearestBranch) {
      console.error('No suitable branch found for destination:', destination);
      return res.status(500).json({ success: false, error: 'Không tìm thấy chi nhánh phù hợp' });
    }

    const distanceInKm = minDistance / 1000;
    const shippingFee = Math.ceil(distanceInKm / 5) * 10000;

    const estimatedDeliveryTime = new Date(Date.now() + duration.value * 1000);

    res.status(200).json({
      success: true,
      branch: nearestBranch,
      distance: distanceInKm,
      duration: duration.text,
      shippingFee,
      estimatedDeliveryTime,
    });
  } catch (error) {
    console.error('Error calculating shipping:', error.message, error.stack); 
    res.status(500).json({ success: false, error: 'Lỗi khi tính toán phí vận chuyển', details: error.message });
  }
};

const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  callback_url: "https://78b5-171-250-162-6.ngrok-free.app/api/order/zalopay-callback",
};

exports.createZaloPayOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
    }

    const {
      orderType,
      branchId,
      deliveryAddress,
      couponCode,
      note,
      redeemPoints,
      shippingFee,
      distance,
      estimatedDeliveryTime,
      pickupTime,
    } = req.body;

    // Validate cart
    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .populate('items.toppings.toppingId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of cart.items) {
      if (!item.productId || !item.productId.price || !item.productId.price[item.size]) {
        return res.status(400).json({ error: 'Lỗi dữ liệu sản phẩm trong giỏ hàng' });
      }
      const basePrice = item.productId.price[item.size];
      const toppingPrice = item.toppings.reduce(
        (sum, topping) => sum + (topping.toppingId?.price || 0) * topping.quantity,
        0
      );
      totalPrice += (basePrice + toppingPrice) * item.quantity;
    }

    // Apply coupon
    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon || coupon.expirationDate < new Date()) {
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }
      discountPrice = coupon.discountValue;
    }

    // Apply points
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    if (redeemPoints > user.points) {
      return res.status(400).json({ error: 'Không đủ điểm để quy đổi' });
    }
    const discountValueFromPoints = Math.floor(redeemPoints / 1000) * 5000;

    // Calculate final price
    const finalPrice = Math.max(
      0,
      totalPrice + (orderType === 'delivery' ? shippingFee : 0) - discountPrice - discountValueFromPoints
    );

    // Validate order type
    if (orderType === 'pickup' && !branchId) {
      return res.status(400).json({ error: 'Vui lòng chọn chi nhánh để lấy hàng' });
    }
    if (orderType === 'delivery' && (!deliveryAddress || !branchId)) {
      return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ và chi nhánh giao hàng' });
    }

    // Prepare ZaloPay order
    const items = cart.items.map(item => ({
      itemid: item.productId._id.toString(),
      itemname: item.productId.name.substring(0, 50),
      itemprice: item.productId.price[item.size],
      itemquantity: item.quantity,
    }));

    const app_trans_id = `${moment().tz('Asia/Ho_Chi_Minh').format('YYMMDD')}_${uuidv4().substring(0, 6)}`;
    console.log('Generated app_trans_id:', app_trans_id); // Log app_trans_id

    const embedData = {
      estimatedTime: estimatedDeliveryTime || "15 phút",
      note: note || "",
      redirecturl: "myapp://home",
      address: deliveryAddress?.substring(0, 512) || "",
      shippingCost: orderType === 'delivery' ? shippingFee : 0,
      usedPoints: redeemPoints.toString(),
      redeemAmount: discountValueFromPoints,
      distanceKm: distance?.toString() || "",
      voucherCode: couponCode || "",
      voucherDiscount: discountPrice,
    };

    const order = {
      app_id: config.app_id,
      app_trans_id,
      app_user: user.email.substring(0, 50) || `user_${userId}`,
      app_time: moment().tz('Asia/Ho_Chi_Minh').valueOf(),
      item: JSON.stringify(items).substring(0, 2048),
      embed_data: JSON.stringify(embedData).substring(0, 1024),
      amount: finalPrice,
      description: `DrinkUp - Thanh toán đơn hàng #${app_trans_id}`.substring(0, 256),
      callback_url: config.callback_url,
      bank_code: "zalopayapp",
    };

    // Generate HMAC
    const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    console.log('HMAC data:', data);
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
    console.log('Generated mac:', order.mac);

    // Log request để debug
    console.log('ZaloPay request:', order);

    // Call ZaloPay API
    const response = await axios.post(config.endpoint, null, { params: order });
    const result = response.data;

    // Log response để debug
    console.log('ZaloPay API response:', result);

    // Kiểm tra response
    if (result.return_code !== 1) {
      console.error('ZaloPay API error:', {
        return_code: result.return_code,
        return_message: result.return_message,
        sub_return_code: result.sub_return_code,
        sub_return_message: result.sub_return_message,
      });
      return res.status(400).json({
        error: 'Không thể tạo đơn hàng ZaloPay',
        details: result.return_message,
        sub_return_code: result.sub_return_code,
        sub_return_message: result.sub_return_message,
      });
    }

    // Save to OrderTemp
    const orderTemp = new OrderTemp({
      user: userId,
      apptransid: app_trans_id,
      totalPrice,
      discountPrice,
      shippingFee,
      finalPrice,
      orderType,
      paymentMethod: 'zalopay',
      couponCode,
      branchId,
      pickupTime: orderType === 'pickup' ? pickupTime : null,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      note,
      orderDetails: cart.items.map(item => ({
        product: item.productId._id,
        quantity: item.quantity,
        size: item.size,
        iceLevel: item.iceLevel,
        sweetLevel: item.sweetLevel,
        toppings: item.toppings.map(topping => ({
          toppingId: topping.toppingId._id,
          name: topping.toppingId.name,
          price: topping.toppingId.price,
          quantity: topping.quantity,
        })),
        price: item.productId.price[item.size],
        toppingsPrice: item.toppings.reduce(
          (sum, topping) => sum + (topping.toppingId?.price || 0) * topping.quantity,
          0
        ),
      })),
      zaloPayData: {
        orderurl: result.order_url,
        zptranstoken: result.zp_trans_token,
        qrcode: result.qr_code,
      },
    });

    await orderTemp.save();
    console.log('order_url:', result.order_url);
    console.log('OrderTemp saved:', orderTemp._id, 'with apptransid:', orderTemp.apptransid);

    // Trả về response từ ZaloPay API
    return res.status(200).json({
      return_code: result.return_code,
      return_message: result.return_message,
      sub_return_code: result.sub_return_code,
      sub_return_message: result.sub_return_message,
      order_url: result.order_url,
      zp_trans_token: result.zp_trans_token,
      order_token: result.order_token,
      qr_code: result.qr_code,
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng ZaloPay:', error);
    return res.status(500).json({ error: 'Lỗi khi tạo đơn hàng ZaloPay', details: error.message });
  }
};

exports.zaloPayCallback = async (req, res) => {
  try {
    console.log('ZaloPay callback received:', req.body); // Log toàn bộ body

    const { data, mac } = req.body;
    if (!data || !mac) {
      console.error('Missing data or mac in callback:', req.body);
      return res.json({ returncode: -1, returnmessage: 'Missing data or mac' });
    }

    const dataStr = data;

    // Verify callback
    const computedMac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    if (computedMac !== mac) {
      console.error('Invalid mac in callback:', { computedMac, mac, dataStr });
      return res.json({ returncode: -1, returnmessage: 'Invalid mac' });
    }

    // Parse callback data
    let callbackData;
    try {
      callbackData = JSON.parse(dataStr);
      console.log('Parsed callback data:', callbackData);
    } catch (error) {
      console.error('Failed to parse callback data:', { dataStr, error: error.message });
      return res.json({ returncode: -1, returnmessage: 'Invalid callback data format' });
    }

    // Sửa: Lấy app_trans_id thay vì apptransid
    const { app_trans_id, zp_trans_id, amount } = callbackData;
    if (!app_trans_id) {
      console.error('Missing app_trans_id in callback data:', callbackData);
      return res.json({ returncode: -1, returnmessage: 'Missing app_trans_id' });
    }

    // Find OrderTemp
    const orderTemp = await OrderTemp.findOne({ apptransid: app_trans_id }); // Sử dụng app_trans_id
    if (!orderTemp) {
      console.error('OrderTemp not found for apptransid:', app_trans_id);
      return res.json({ returncode: -1, returnmessage: 'Order data not found' });
    }

    // Check if order already processed
    const existingOrder = await Order.findOne({ apptransid: app_trans_id });
    if (existingOrder) {
      console.warn('Duplicate transaction for apptransid:', app_trans_id);
      return res.json({ returncode: 2, returnmessage: 'Duplicate transaction' });
    }

    // Create Order
    const newOrder = new Order({
      user: orderTemp.user,
      totalPrice: orderTemp.totalPrice,
      discountPrice: orderTemp.discountPrice,
      shippingFee: orderTemp.shippingFee,
      finalPrice: orderTemp.finalPrice,
      orderStatus: 'new',
      paymentStatus: 'paid',
      paymentMethod: orderTemp.paymentMethod,
      orderType: orderTemp.orderType,
      couponCode: orderTemp.couponCode,
      branchId: orderTemp.branchId,
      deliveryAddress: orderTemp.deliveryAddress,
      estimatedDeliveryTime: orderTemp.pickupTime || orderTemp.createdAt,
      note: orderTemp.note,
      apptransid: app_trans_id,
      zptransid: zp_trans_id,
    });

    await newOrder.save();
    console.log('New order saved:', newOrder._id);

    // Create OrderDetails
    for (const item of orderTemp.orderDetails) {
      const orderDetail = new OrderDetail({
        orderId: newOrder._id,
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        iceLevel: item.iceLevel,
        sweetLevel: item.sweetLevel,
        toppings: item.toppings.map((topping) => ({
          toppingId: topping.toppingId,
          name: topping.name,
          price: topping.price,
          quantity: topping.quantity,
        })),
        price: item.price,
        toppingsPrice: item.toppingsPrice,
      });
      await orderDetail.save();
    }

    // Deduct points
    const user = await User.findById(orderTemp.user);
    if (user && orderTemp.redeemPoints) {
      user.points -= orderTemp.redeemPoints;
      await user.save();
      console.log('User points updated:', user.points);
    } else if (!user) {
      console.warn('User not found for userId:', orderTemp.user);
    }

    // Clear cart
    await Cart.findOneAndDelete({ userId: orderTemp.user });
    console.log('Cart cleared for user:', orderTemp.user);

    // Delete OrderTemp
    await OrderTemp.deleteOne({ apptransid: app_trans_id });
    console.log('OrderTemp deleted for apptransid:', app_trans_id);

    res.json({ returncode: 1, returnmessage: 'Success' });
  } catch (error) {
    console.error('Lỗi trong callback ZaloPay:', error);
    res.json({ returncode: 0, returnmessage: error.message });
  }
};