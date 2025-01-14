require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');

connectDB();
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
