const Category = require('../models/Category');
const Product = require('../models/Product');
const OrderDetail = require('../models/OrderDetail');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

exports.getTopSellingProducts = async (req, res) => {
    try {
        const topProducts = await OrderDetail.aggregate([
            {
                $group: {
                    _id: "$product", 
                    totalSold: { $sum: "$quantity" }
                }
            },
            { $sort: { totalSold: -1 } }, 
            { $limit: 10 }, 
            {
                $lookup: {
                    from: "products", 
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }
        ]);
        res.status(200).json({ success: true, data: topProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId, page = 1, limit = 10 } = req.query; 
        const query = categoryId ? { category: categoryId } : {};
        
        const products = await Product.find(query)
            .sort({ price: 1 }) 
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};