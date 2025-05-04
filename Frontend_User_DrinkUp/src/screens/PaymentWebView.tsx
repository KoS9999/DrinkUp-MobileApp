import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, BackHandler, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import Toast from 'react-native-toast-message';

type PaymentWebViewRouteProp = RouteProp<RootStackParamList, 'PaymentWebView'>;

type PaymentWebViewProps = {
  route: PaymentWebViewRouteProp;
  navigation: StackNavigationProp<RootStackParamList, 'PaymentWebView'>;
};

const PaymentWebView: React.FC<PaymentWebViewProps> = ({ route, navigation }) => {
  const { paymentUrl, apptransid, amount, expiresAt } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleNavigationStateChange = async (navState: { url: string }) => {
    if (navState.url.includes('payment-success') || navState.url.includes('callback')) {
      try {
        await checkPaymentStatus();
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Hủy thanh toán?',
      'Bạn có chắc muốn hủy quá trình thanh toán này không? Đơn hàng của bạn sẽ không được xử lý.',
      [
        { text: 'Tiếp tục thanh toán', style: 'cancel' },
        { text: 'Hủy thanh toán', style: 'destructive', onPress: () => navigation.navigate('HomeScreen') }
      ]
    );
  };

  const checkPaymentStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/order/zalopay/status/${apptransid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Thanh toán thành công',
          text2: `Đơn hàng của bạn đang được xử lý!`,
        });
        navigation.navigate('HomeScreen');
      } else if (data.status === 'pending') {
      } else {
        setErrorMessage('Thanh toán không thành công. Vui lòng thử lại sau.');
        setTimeout(() => {
          navigation.navigate('HomeScreen');
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking ZaloPay payment status:', error);
      setErrorMessage('Không thể kiểm tra trạng thái thanh toán. Vui lòng kiểm tra đơn hàng trong lịch sử.');
    }
  };

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.redirectText}>Bạn sẽ được chuyển hướng về trang chủ...</Text>
        </View>
      ) : (
        <>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6347" />
              <Text style={styles.loadingText}>Đang kết nối đến cổng thanh toán...</Text>
            </View>
          )}
          
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Mã giao dịch: {apptransid}
            </Text>
            <Text style={styles.infoText}>
              Số tiền: {amount?.toLocaleString()}đ
            </Text>
            <Text style={styles.infoText}>
              Thời hạn thanh toán: {new Date(expiresAt).toLocaleTimeString()}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#FF6347',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10,
  },
  redirectText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  infoContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
});

export default PaymentWebView;