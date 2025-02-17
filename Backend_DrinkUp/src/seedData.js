const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const OrderDetail = require('./models/OrderDetail');
const Topping = require('./models/Topping');
require('dotenv').config(); 

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const categoriesData = [
    { name: 'Cafe' , imageUrl: ''},
    { name: 'Đá xay' , imageUrl: ''},
    { name: 'Sinh Tố' , imageUrl: ''},
    { name: 'Trà' , imageUrl: ''},
    { name: 'Bánh' , imageUrl: ''}
];

const toppingsData = [
    { name: 'Chân châu đen', price: 5000 },
    { name: 'Thạch', price: 7000 },
    { name: 'Kem', price: 10000 },
    { name: 'Thạch rau câu', price: 7000 },
    { name: 'Thạch phô mai', price: 7000 },
    { name: 'Chân châu trắng', price: 5000 }
];

const seedDatabase = async () => {
    try {
        await Category.deleteMany();
        await Product.deleteMany();
        await Order.deleteMany();
        await OrderDetail.deleteMany();
        await Topping.deleteMany();

        const createdCategories = await Category.insertMany(categoriesData);
        console.log('Danh mục đã được thêm:', createdCategories);
        const createdToppings = await Topping.insertMany(toppingsData);
        console.log('Topping đã được thêm:', createdToppings);

        const productsData = [
            { name: 'Cafe Sữa', price: { S: 20000, M: 25000, L: 30000 }, category: createdCategories[0]._id, description: 'Cafe sữa thơm ngon', imageUrl: '', toppings: [createdToppings[0]._id, createdToppings[1]._id] },
            { name: 'Sinh tố Bơ', price: { S: 30000, M: 35000, L: 40000 }, category: createdCategories[2]._id, description: 'Sinh tố bơ nguyên chất', imageUrl: '', toppings: [createdToppings[2]._id] },
            { name: 'Trà Đào', price: { S: 25000, M: 30000, L: 35000 }, category: createdCategories[3]._id, description: 'Trà đào tươi mát', imageUrl: '', toppings: [createdToppings[1]._id, createdToppings[2]._id] }
        ];

        const createdProducts = await Product.insertMany(productsData);
        console.log('Sản phẩm đã được thêm:', createdProducts);

        const userId = new mongoose.Types.ObjectId('67868762f15f9725ec1da68f');

        const ordersData = [
            { user: userId, totalPrice: 100000, discountPrice: 10000, finalPrice: 90000, orderStatus: 'confirmed', paymentStatus: 'paid' },
            { user: userId, totalPrice: 120000, discountPrice: 5000, finalPrice: 115000, orderStatus: 'delivered', paymentStatus: 'paid' }
        ];
        const createdOrders = await Order.insertMany(ordersData);
        console.log('Đơn hàng đã được thêm:', createdOrders);

        const orderDetailsData = [
            { orderId: createdOrders[0]._id, product: createdProducts[0]._id, quantity: 5, size: 'M', toppings: [createdToppings[0]._id], price: 25000 },
            { orderId: createdOrders[0]._id, product: createdProducts[1]._id, quantity: 7, size: 'L', toppings: [createdToppings[1]._id], price: 40000 },
            { orderId: createdOrders[1]._id, product: createdProducts[2]._id, quantity: 10, size: 'S', toppings: [createdToppings[2]._id], price: 25000 }
        ];
        const createdOrderDetails = await OrderDetail.insertMany(orderDetailsData);
        console.log('Chi tiết đơn hàng đã được thêm:', createdOrderDetails);

        mongoose.connection.close();
        console.log('Seeding hoàn tất!');
    } catch (error) {
        console.error('Lỗi khi chèn dữ liệu:', error);
        mongoose.connection.close();
    }
};

seedDatabase();
