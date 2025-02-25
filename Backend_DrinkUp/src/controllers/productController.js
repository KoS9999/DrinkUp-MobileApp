const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Topping = require('../models/Topping');

const findProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({message: 'ProductID không hợp lệ'});
        }

        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('toppings', 'name price');

        if (!product) {
            return res.status(404).json({message: 'Không tìm thấy sản phẩm'});
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {findProductById};