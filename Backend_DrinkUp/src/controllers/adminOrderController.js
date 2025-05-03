const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const mongoose = require('mongoose');

const STATUS_TRANSITIONS = {
  new: ['processing', 'canceled'],
  processing: ['confirmed', 'canceled'],
  confirmed: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: [],
  canceled: [],
  cancel_request: ['canceled']
};

exports.getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status, 
      paymentStatus,
      orderType,
      fromDate,
      toDate
    } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderType) filter.orderType = orderType;
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .populate('branchId', 'name address')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID đơn hàng không hợp lệ' 
      });
    }

    const [order, details] = await Promise.all([
      Order.findById(orderId)
        .populate('user', 'name email phone')
        .populate('branchId', 'name address phone'),
      OrderDetail.find({ orderId })
        .populate('product', 'name price imageUrl')
        .populate('toppings.toppingId', 'name price')
    ]);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        details
      }
    });

  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID đơn hàng không hợp lệ' 
      });
    }

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng' 
      });
    }

    if (!STATUS_TRANSITIONS[order.orderStatus]?.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ ${order.orderStatus} sang ${newStatus}`
      });
    }

    order.orderStatus = newStatus;
    await order.save();

    const userId = order.user._id.toString();
    const io = req.app.locals.io;
    const connectedUsers = req.app.locals.connectedUsers;
    const socketId = connectedUsers.get(userId);
    
    const updateTime = new Date().toISOString();

    console.log(`Đã cập nhật orderStatus: ${newStatus} cho đơn hàng ${order._id}`);
    console.log(`Đang tìm socketId của user ${userId}...`, socketId ? `Found: ${socketId}` : `Not connected`);

    if (socketId) {
      io.to(socketId).emit('orderStatusUpdated', {
        orderId,
        newStatus,
        updateTime,
        message: `Đơn hàng ${order._id} đã được cập nhật trạng thái: ${newStatus}`
      });
      console.log(`Đã gửi socket event tới ${socketId}`);
    }

    res.status(200).json({ 
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: order
    });

  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newPaymentStatus } = req.body;

    if (!['paid', 'unpaid'].includes(newPaymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ'
      });
    }

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng' 
      });
    }

    order.paymentStatus = newPaymentStatus;
    await order.save();

    const userId = order.user._id.toString();
    const io = req.app.locals.io;
    const connectedUsers = req.app.locals.connectedUsers;
    const socketId = connectedUsers.get(userId);
    
    const updateTime = new Date().toISOString();

    console.log(`Đã cập nhật paymentStatus: ${newPaymentStatus} cho đơn hàng ${order._id}`);
    console.log(`Đang tìm socketId của user ${userId}...`, socketId ? `Found: ${socketId}` : `Not connected`);

    if (socketId) {
      io.to(socketId).emit('paymentStatusUpdated', {
        orderId,
        newPaymentStatus,
        updateTime,
        message: `Đơn hàng ${order._id} đã cập nhật trạng thái thanh toán: ${newPaymentStatus}`
      });
      console.log(`Đã gửi socket event tới ${socketId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: order
    });

  } catch (error) {
    console.error('Lỗi cập nhật thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};