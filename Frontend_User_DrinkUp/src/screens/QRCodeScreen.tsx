import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { RouteProp } from '@react-navigation/native';

// Định nghĩa kiểu cho tham số navigation
type QRCodeScreenRouteParams = {
  QRCodeScreen: {
    qrContent: string;
  };
};

// Định nghĩa kiểu cho route
type QRCodeScreenRouteProp = RouteProp<QRCodeScreenRouteParams, 'QRCodeScreen'>;

// Định nghĩa props cho component
interface QRCodeScreenProps {
  route: QRCodeScreenRouteProp;
}

const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ route }) => {
  const { qrContent } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quét mã QR để thanh toán ZaloPay</Text>
      <QRCode
        value={qrContent}
        size={200}
        color="black"
        backgroundColor="white"
      />
      <Text style={styles.instruction}>
        Mở ứng dụng ZaloPay và quét mã QR này để hoàn tất thanh toán.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default QRCodeScreen;