const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');
const Topping = require('../models/Topping');

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

module.exports = {
    findProductById,
    countCustomersByProductId,
    getReviewsByProductId
};
