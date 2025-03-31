const Product = require('../models/Product');
const FavoriteProduct = require('../models/FavoriteProduct');
const mongoose = require('mongoose');

exports.getFavouriteProduct = async (req, res) => {
    try {
        console.log('Đã vào danh sách yêu thích');
        const userId = req.userId;

        if (!userId) {
            console.log('Không tìm thấy userId');
            return res.status(400).json({ error: 'Không tìm thấy userId' });
        }
        console.log('userId: ', userId);

        const favoriteProduct = await FavoriteProduct.getFavoriteProductByUserId(userId);

        console.log('FavoriteProduct data: ', favoriteProduct);

        res.status(200).json(favoriteProduct);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sp yêu thích: ', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách sp yêu thích', details: error.message });
    }
}

exports.addToFavouriteProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = req.userId;

    try {
        const productObjectId = new mongoose.Types.ObjectId(productId);

        const product = await Product.findById(productObjectId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        let favoriteProduct = await FavoriteProduct.findOne({ userId });

        if (!favoriteProduct) {
            favoriteProduct = new FavoriteProduct({
                userId,
                items: [{ productId: productObjectId }]
            });
            await favoriteProduct.save();
            return res.status(201).json({ message: 'Đã thêm vào danh sách sản phẩm yêu thích', favoriteProduct });
        }

        // Kiểm tra xem sản phẩm đã có trong danh sách chưa
        const isProductInFavorites = favoriteProduct.items.some(item =>
            item.productId.equals(productObjectId)
        );

        if (isProductInFavorites) {
            return res.status(409).json({ message: 'Đã có trong danh sách sản phẩm yêu thích' });
        }

        // Nếu chưa có, thêm sản phẩm vào danh sách
        favoriteProduct.items.push({ productId: productObjectId });
        await favoriteProduct.save();

        res.status(201).json({ message: 'Đã thêm vào danh sách sản phẩm yêu thích', favoriteProduct });

    } catch (error) {
        console.error('Lỗi khi thêm vào danh sách yêu thích:', error);
        res.status(500).json({ message: 'Lỗi server', details: error.message });
    }
};

exports.removeFromFavouriteProduct = async (req, res) => {
    const { itemId } = req.params;
    const userId = req.userId;

    try {
        let favoriteProductList = await FavoriteProduct.findOne({ userId });
        if (!favoriteProductList) {
            return res.status(404).json({ message: 'Danh sách sản phẩm yêu thích không tồn tại' });
        }

        const objectId = new mongoose.Types.ObjectId(itemId);

        const itemIndex = favoriteProductList.items.findIndex(item => item._id.equals(objectId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong danh sách sản phẩm yêu thích' });
        }

        //Xóa sản phẩm khỏi giỏ hàng
        favoriteProductList.items.splice(itemIndex, 1);

        // Nếu giỏ hàng trống, xóa luôn giỏ hàng
        if (favoriteProductList.items.length === 0) {
            await FavoriteProduct.deleteOne({ _id: favoriteProductList._id });
            return res.status(200).json({ message: 'Danh sách sản phẩm yêu thích đã được xóa' });
        } else {
            await favoriteProductList.save();
        }

        res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi danh sách sản phẩm yêu thích', favoriteProductList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}