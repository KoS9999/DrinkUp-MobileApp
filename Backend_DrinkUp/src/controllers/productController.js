const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const Topping = require('../models/Topping');
const Order = require('../models/Order');

// Find product by ID
const findProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ProductID không hợp lệ' });
        }

        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('toppings', 'name price');

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json({
            success: true,
            product,
            sweetLevels: ['Không ngọt', 'Ít ngọt', 'Ngọt bình thường', 'Nhiều ngọt'],
            iceLevels: ['Không đá', 'Ít đá', 'Đá bình thường', 'Đá riêng'],
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Count customers who have bought the product
const countCustomersByProductId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ProductID không hợp lệ' });
        }

        const orderDetails = await OrderDetail.find({ product: id }).distinct('orderId');

        const customerCount = orderDetails.length;

        res.status(200).json({
            success: true,
            customerCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get reviews by product ID
const getReviewsByProductId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ProductID không hợp lệ' });
        }

        const reviews = await Review.find({ product: id }).populate('user', 'name').sort({ createdAt: -1 });

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'Chưa có bình luận cho sản phẩm này' });
        }

        res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getSimilarProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
    
        if (!product) return res.status(404).json({ message: 'Product not found' });
    
        // Lấy sản phẩm cùng category, loại bỏ chính nó
        const similarProducts = await Product.find({
          _id: { $ne: product._id },
          category: product.category,
        }).limit(6); // Giới hạn 6 sản phẩm
    
        res.json(similarProducts);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
      }
}

const getPurchaseStats = async (req, res) => {
  const { productId } = req.params;

  try {
    // 1. Lấy tất cả OrderDetail chứa sản phẩm
    const orderDetails = await OrderDetail.find({ product: productId }).lean();
    if (orderDetails.length === 0) {
      return res.json({
        totalPurchases: 0,
        uniqueBuyers: 0
      });
    }

    // 2. Lấy danh sách orderIds
    const orderIds = orderDetails.map(item => item.orderId);

    // 3. Lấy thông tin các Order đã thanh toán
    const paidOrders = await Order.find({
      _id: { $in: orderIds },
      paymentStatus: 'paid'
    }).select('user').lean();

    const paidOrderIds = paidOrders.map(o => o._id.toString());
    const userIds = new Set(paidOrders.map(o => o.user.toString()));

    // 4. Tính tổng số lượt mua từ các OrderDetail liên quan
    const totalPurchases = orderDetails.reduce((sum, item) => {
      return paidOrderIds.includes(item.orderId.toString())
        ? sum + item.quantity
        : sum;
    }, 0);

    res.json({
      totalPurchases,             // Tổng số lượt mua (quantity)
      uniqueBuyers: userIds.size  // Số người dùng duy nhất đã mua
    });

  } catch (err) {
    console.error('Lỗi khi lấy thống kê mua hàng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = {
    findProductById,
    countCustomersByProductId,
    getReviewsByProductId,
    getSimilarProducts,
    getPurchaseStats
};
