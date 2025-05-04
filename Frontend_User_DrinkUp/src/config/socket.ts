import { io } from 'socket.io-client';

// const socket = io('http://192.168.2.11:5000', {
//   transports: ['websocket'],
//   forceNew: true,
//   reconnection: true,
//   timeout: 10000,
// });

const socket = io('http://192.168.2.11:5000', {
  transports: ['websocket'],
  forceNew: true,
  reconnection: true,
  timeout: 10000,
});

export default socket;
