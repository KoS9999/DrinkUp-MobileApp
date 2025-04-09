require('dotenv').config();
//require('dotenv').config({ path: './src/.env' });
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io')
const connectDB = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const homeRoutes = require('./src/routes/homeRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const favoriteRoutes = require('./src/routes/favoriteRoutes');

connectDB();
const app = express();
const server = http.createServer(app);
// Socket.IO setup
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });
  const connectedUsers = new Map();
  
  io.on('connection', (socket) => {
    console.log('Client connected to socket:', socket.id);
  
    socket.on('join', (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ID: ${socket.id}`);
    });
  
    socket.on('disconnect', () => {
      for (const [userId, sockId] of connectedUsers.entries()) {
        if (sockId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`🔌 User ${userId} disconnected (socket ID: ${socket.id})`);
        }
      }
    });
  });

// Gắn io và connectedUsers vào app locals để dùng ở controller
app.locals.io = io;
app.locals.connectedUsers = connectedUsers;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/favorite', favoriteRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));