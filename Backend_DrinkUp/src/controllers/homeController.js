const Category = require('../models/Category');
const Product = require('../models/Product');
const OrderDetail = require('../models/OrderDetail');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        const result = categories.map(cate => ({
            id: cate._id.toString(),
            name: cate.name,
            imageUrl: cate.imageUrl,
        }));
        res.status(200).json({ success: true, data: result });
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

// exports.getProductsByCategory = async (req, res) => {
//     try {
//         const { categoryId, page = 1, limit = 10 } = req.query; 
//         const query = categoryId ? { category: categoryId } : {};
        
//         const products = await Product.find(query)
//             .sort({ price: 1 }) 
//             .skip((page - 1) * limit)
//             .limit(parseInt(limit));
        
//         res.status(200).json({ success: true, data: products });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
//     }
// };

//Dùng qua API dưới đây để hiển thị sản phẩm theo từng danh mục + sắp xếp tăng dần (cho từng danh mục) cùng với Lazy Loading
exports.getProductsByCategory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const categories = await Category.find();

        const result = await Promise.all (
            categories.map(async (category) => {
                const query = { category: category._id };

                const products = await Product.find(query)
                    .sort({ price: 1 }) 
                    .skip((page - 1) * limit) 
                    .limit(parseInt(limit)); 

                const totalProducts = await Product.countDocuments(query);

                return {
                    categoryId: category._id,
                    categoryName: category.name,
                    products: products,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                };
            })
        );

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const { query, page = 1, limit = 10 } = req.query; 
        if (!query) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        const searchRegex = new RegExp(query, 'i'); // 'i' là tìm kiếm không phân biệt chữ hoa/thường

        const products = await Product.find({
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments({
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        });

        res.status(200).json({
            success: true,
            data: {
                products,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
