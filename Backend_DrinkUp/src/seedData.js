const mongoose = require('mongoose');

// Định nghĩa schema cho Branch
const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: String,
  openingHours: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const Branch = mongoose.model('Branch', branchSchema);

// Ghi thẳng MONGO_URI vào mã nguồn
const MONGO_URI = 'mongodb+srv://nnt1211:MongoDBId1211@cluster0.0skez.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const branchesData = [
  {
    name: 'Chi nhánh 1',
    address: '01 Đ. Võ Văn Ngân, Linh Chiểu, Thủ Đức, Hồ Chí Minh, Việt Nam',
    phone: '0123456789',
    openingHours: '08:00 - 22:00',
    status: 'open',
    coordinates: {
      latitude: 10.850298,
      longitude: 106.771997
    }
  },
  {
    name: 'Chi nhánh 2',
    address: '1 Đ. Độc Lập, Quán Thánh, Ba Đình, Hà Nội, Việt Nam',
    phone: '0987654321',
    openingHours: '07:00 - 21:00',
    status: 'open',
    coordinates: {
      latitude: 21.037184211605222,
      longitude: 105.83747400167883
    }
  }
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