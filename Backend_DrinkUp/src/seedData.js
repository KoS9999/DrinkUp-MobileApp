const mongoose = require('mongoose');
const Branch = require('./models/Branch');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const branchesData = [
    { name: 'Chi nhánh 1', address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh', phone: '0123456789', openingHours: '08:00 - 22:00', status: 'open' },
    { name: 'Chi nhánh 2', address: '456 Đường XYZ, Quận 3, TP. Hồ Chí Minh', phone: '0987654321', openingHours: '07:00 - 21:00', status: 'open' }
];

const seedBranches = async () => {
    try {
        await Branch.deleteMany();
        const createdBranches = await Branch.insertMany(branchesData);
        console.log('Chi nhánh đã được thêm:', createdBranches);
        mongoose.connection.close();
        console.log('Seeding hoàn tất!');
    } catch (error) {
        console.error('Lỗi khi chèn dữ liệu:', error);
        mongoose.connection.close();
    }
};

seedBranches();
