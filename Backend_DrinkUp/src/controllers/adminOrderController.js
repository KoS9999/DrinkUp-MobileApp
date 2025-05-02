const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');
const OrderDetail = require('../models/OrderDetail');
const User = require('../models/User');

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;
  
    try {
      const order = await Order.findById(orderId).populate('user');
      if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
  
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
        order,
        updateTime
      });
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      res.status(500).json({ success: false, error: 'Lỗi máy chủ', details: error.message });
    }
  };