import React, { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../config/socket';

const SocketListener = () => {
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const joinUserRoom = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?.id || parsedUser?._id;

        if (userId && !hasJoinedRef.current) {
          socket.emit('join', userId);
          console.log('Emit join with userId:', userId);
          hasJoinedRef.current = true;
        }
      } catch (err) {
        console.error('Lỗi đọc AsyncStorage:', err);
      }
    };

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      joinUserRoom();
    });

    socket.on('orderStatusUpdated', ({ orderId, newStatus, updateTime }) => {
      const time = new Date(updateTime).toLocaleTimeString('vi-VN');
      console.log('🔔 Nhận socket orderStatusUpdated:', { orderId, newStatus, updateTime });

      Toast.show({
        type: 'info',
        text1: `📦 Đơn hàng #${orderId}`,
        text2: `Trạng thái: ${newStatus} lúc ${time}`,
        visibilityTime: 5000,
        autoHide: true,
      });
    });

    return () => {
      socket.off('orderStatusUpdated');
      socket.off('connect');
    };
  }, []);

  return null;
};

export default SocketListener;
