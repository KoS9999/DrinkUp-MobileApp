const Category = require('../models/Category');
const Product = require('../models/Product');
const OrderDetail = require('../models/OrderDetail');
const Favorite = require('../models/Favorite');

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
        const { query, sortBy, order = "asc", page = 1, limit = 10 } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        const searchRegex = new RegExp(query, 'i');
        let filter = {
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        };

        let sortCriteria = {};
        if (sortBy === "price") {
            sortCriteria["price.S"] = order === "desc" ? -1 : 1;
        } else if (sortBy === "name") {
            sortCriteria.name = order === "desc" ? -1 : 1;
        }

        const products = await Product.find(filter)
            .sort(sortCriteria) 
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(filter);

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


exports.filterAndSortProducts = async (req, res) => {
    try {
        const { query, category, sortBy, order = "asc", page = 1, limit = 10 } = req.query;

        let filter = {};

        if (category) {
            const categoryData = await Category.findOne({ name: category });
            if (!categoryData) {
                return res.status(404).json({ success: false, message: "Category không tồn tại" });
            }
            filter.category = categoryData._id;
        }

        if (query) {
            const searchRegex = new RegExp(query, "i");
            filter.$or = [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ];
        }

        let sortCriteria = {};
        if (sortBy) {
            if (sortBy === "price") {
                sortCriteria["price.S"] = order === "desc" ? -1 : 1;
            } else if (sortBy === "name") {
                sortCriteria.name = order === "desc" ? -1 : 1;
            }
        }

        const products = await Product.find(filter)
            .sort(sortCriteria)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                products,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

exports.checkFavoriteStatus = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const favorite = await Favorite.findOne({ user: userId });

        if (!favorite) {
            return res.status(200).json({ isFavorite: false });
        }

        const isFavorite = favorite.products.includes(productId);

        res.status(200).json({ isFavorite });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.addToFavorites = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        let favorite = await Favorite.findOne({ user: userId });

        if (!favorite) {
            favorite = new Favorite({
                user: userId,
                products: [productId],
            });
            await favorite.save();
            return res.status(201).json({ message: 'Product added to favorites', favorite });
        }

        if (favorite.products.includes(productId)) {
            return res.status(400).json({ message: 'Product is already in favorites' });
        }
        favorite.products.push(productId);
        await favorite.save();

        res.status(200).json({ message: 'Product added to favorites', favorite });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.removeFromFavorites = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        let favorite = await Favorite.findOne({ user: userId });

        if (!favorite) {
            return res.status(400).json({ message: 'No favorites found for this user' });
        }

        if (!favorite.products.includes(productId)) {
            return res.status(400).json({ message: 'Product not found in favorites' });
        }

        favorite.products = favorite.products.filter(product => product.toString() !== productId.toString());
        await favorite.save();

        res.status(200).json({ message: 'Product removed from favorites', favorite });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};