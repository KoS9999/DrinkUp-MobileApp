const mongoose = require('mongoose');
const Coupon = require('./models/Coupon'); 
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const couponsData = [
    { code: 'DISCOUNT10', discountValue: 10, expirationDate: new Date(new Date().setMonth(new Date().getMonth() + 10)), isActive: true },
    { code: 'DISCOUNT20', discountValue: 20, expirationDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), isActive: true }
];

const seedCoupons = async () => {
    try {
        await Coupon.deleteMany(); 
        const createdCoupons = await Coupon.insertMany(couponsData);
        console.log('Mã giảm giá đã được thêm:', createdCoupons);
        mongoose.connection.close();
        console.log('Seeding hoàn tất!');
    } catch (error) {
        console.error('Lỗi khi chèn dữ liệu:', error);
        mongoose.connection.close();
    }
};

seedCoupons();
