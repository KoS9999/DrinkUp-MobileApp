import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  RefreshControl,
  BackHandler,
  Linking,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { TimePickerModal } from 'react-native-paper-dates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_BASE_URL } from '../config/api';
import { RootStackParamList } from '../navigators/AppNavigator';

// Define navigation and route prop types
type NavigationProps = StackNavigationProp<RootStackParamList, 'HomeScreen'>;
type RouteProps = any;

// Define data types
type Topping = {
  _id: string;
  toppingId: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

type Product = {
  _id: string;
  name: string;
  imageUrl: string;
  price: Record<string, number>;
};

type CartItem = {
  _id: string;
  productId: Product;
  quantity: number;
  size: 'S' | 'M' | 'L';
  iceLevel: string;
  sweetLevel: string;
  toppings: Topping[];
};

const getAuthToken = async () => {
  return await AsyncStorage.getItem('userToken');
};

const OrderScreen: React.FC = () => {
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [originalTotalPrice, setOriginalTotalPrice] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [pickupTime, setPickupTime] = useState<{ hours: number; minutes: number }>({
    hours: 12,
    minutes: 0,
  });
  const [visible, setVisible] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [redeemPoints, setRedeemPoints] = useState<string>('');
  const [pointsDiscount, setPointsDiscount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps>();
  const parsedRedeemPoints = parseInt(redeemPoints) || 0;

  useEffect(() => {
    if (route.params?.deliveryAddress) {
      setAddress(route.params.deliveryAddress);
    }
    if (route.params?.shippingDetails) {
      setShippingFee(route.params.shippingDetails.shippingFee);
      setSelectedBranch(route.params.shippingDetails.branch);
      setTotalPrice(
        originalTotalPrice +
          (deliveryMethod === 'delivery' ? route.params.shippingDetails.shippingFee : 0) -
          discountPrice -
          pointsDiscount
      );
    }
  }, [route.params, originalTotalPrice, discountPrice, pointsDiscount, deliveryMethod]);

  // Fetch cart and branches on mount
  useEffect(() => {
    fetchCart();
    fetchBranches();
  }, []);

  // Update total price when dependencies change
  useEffect(() => {
    setTotalPrice(
      originalTotalPrice +
        (deliveryMethod === 'delivery' ? shippingFee : 0) -
        discountPrice -
        pointsDiscount
    );
  }, [originalTotalPrice, shippingFee, discountPrice, pointsDiscount, deliveryMethod]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        const items: CartItem[] = data.items?.map((item: any) => ({
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          iceLevel: item.iceLevel,
          sweetLevel: item.sweetLevel,
          toppings: item.toppings || [],
        })) || [];

        setCart(items);

        const total = items.reduce((sum: number, item: CartItem) => {
          const basePrice = item.productId?.price?.[item.size] || 0;
          const toppingPrice = item.toppings.reduce(
            (tSum, topping) => tSum + (topping.toppingId?.price || 0) * topping.quantity,
            0
          );
          return sum + (basePrice + toppingPrice) * item.quantity;
        }, 0);

        setOriginalTotalPrice(total);
      }
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/order/branches`);
      const data = await response.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
      } else {
        console.error('Dữ liệu trả về không hợp lệ:', data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chi nhánh:', error);
    }
  };

  // Preview redeem points
  const previewRedeemPoints = async () => {
    const parsedPoints = parseInt(redeemPoints);
    if (!parsedPoints || parsedPoints % 1000 !== 0) {
      Toast.show({
        type: 'error',
        text1: 'Điểm không hợp lệ',
        text2: 'Chỉ được quy đổi bội số của 1000 điểm.',
      });
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/order/redeem-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: parsedPoints }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPointsDiscount(data.discountValue);
        Toast.show({
          type: 'success',
          text1: 'Ước tính giảm giá thành công!',
          text2: `Sẽ giảm ${data.discountValue.toLocaleString()}đ khi thanh toán.`,
        });
      } else {
        setPointsDiscount(0);
        Toast.show({
          type: 'error',
          text1: 'Không thể quy đổi',
          text2: data.error || 'Vui lòng kiểm tra lại điểm bạn đã nhập.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi xem điểm quy đổi:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối tới server.',
      });
    }
  };

  // Apply discount coupon
  const applyDiscount = async () => {
    if (!promoCode.trim()) {
      setDiscountPrice(0);
      Toast.show({
        type: 'info',
        text1: 'Mã khuyến mãi trống',
        text2: 'Vui lòng nhập mã trước khi áp dụng.',
      });
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/order/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ couponCode: promoCode }),
      });

      const data = await response.json();
      if (data.success) {
        setDiscountPrice(data.discountPrice);
        Toast.show({
          type: 'success',
          text1: 'Áp dụng mã thành công!',
          text2: data.message || 'Bạn đã được giảm giá.',
        });
      } else {
        setDiscountPrice(0);
        Toast.show({
          type: 'error',
          text1: 'Mã không hợp lệ',
          text2: data.error || 'Không thể áp dụng mã khuyến mãi này.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng mã giảm giá:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể áp dụng mã giảm giá. Vui lòng kiểm tra kết nối mạng.',
      });
    }
  };

  // Time picker handlers
  const onDismiss = () => {
    setVisible(false);
  };

  const onConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setPickupTime({ hours, minutes });
    setVisible(false);
  };

  const placeOrder = async () => {
    if (!selectedPayment) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn phương thức thanh toán.',
      });
      return;
    }
    if (deliveryMethod === 'delivery' && !address) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập địa chỉ giao hàng.',
      });
      return;
    }
    if (deliveryMethod === 'pickup' && !selectedBranch) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn chi nhánh để lấy hàng.',
      });
      return;
    }

    try {
      const token = await getAuthToken();
      // Chuyển pickupTime thành Date nếu là pickup
      let estimatedDeliveryTime: string | null = null;
      let pickupDate: Date | null = null;
      if (deliveryMethod === 'pickup') {
        const today = new Date();
        pickupDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          pickupTime.hours,
          pickupTime.minutes
        );
        estimatedDeliveryTime = `${pickupTime.hours}:${pickupTime.minutes.toString().padStart(2, '0')}`;
      } else {
        estimatedDeliveryTime = route.params?.shippingDetails?.duration || '15 phút';
      }

      const orderData = {
        orderType: deliveryMethod,
        branchId: deliveryMethod === 'pickup' ? selectedBranch?._id : route.params?.shippingDetails?.branch?._id,
        deliveryAddress: deliveryMethod === 'delivery' ? address : null,
        couponCode: promoCode || null,
        paymentMethod: selectedPayment.toLowerCase() === 'cod' ? 'cod' : 'zalopay',
        note: note || '',
        redeemPoints: parsedRedeemPoints,
        shippingFee: deliveryMethod === 'delivery' ? shippingFee : 0,
        distance: deliveryMethod === 'delivery' ? route.params?.shippingDetails?.distance : null,
        estimatedDeliveryTime,
        pickupTime: deliveryMethod === 'pickup' ? pickupDate : null, // Gửi Date cho pickup
        distanceKm: deliveryMethod === 'delivery' ? route.params?.shippingDetails?.distance?.toString() : '',
        voucherCode: promoCode || '',
        voucherDiscount: discountPrice,
      };

      let endpoint = `${API_BASE_URL}/order/create/cod`;
      if (selectedPayment.toLowerCase() === 'ví zalopay') {
        endpoint = `${API_BASE_URL}/order/create/zalopay`;
      }

      console.log('Sending orderData:', orderData);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      console.log('placeOrder response:', data); 

      if (response.ok) {
        if (selectedPayment.toLowerCase() === 'ví zalopay') {
          // Xử lý thanh toán ZaloPay
          if (data.order_url && data.order_url.includes('openinapp')) {
            console.log('Opening order_url:', data.order_url);
            try {
              const canOpen = await Linking.canOpenURL(data.order_url);
              if (canOpen) {
                await Linking.openURL(data.order_url);
                Toast.show({
                  type: 'info',
                  text1: 'Chuyển hướng',
                  text2: 'Đang chuyển hướng đến ZaloPay để thanh toán...',
                });
                // Chuyển về HomeScreen sau khi mở URL
                setTimeout(() => {
                  setCart([]);
                  navigation.navigate('HomeScreen');
                }, 1000);
              } else {
                console.warn('Cannot open ZaloPay app, showing QR code');
                if (data.qr_code) {
                  Toast.show({
                    type: 'info',
                    text1: 'Không tìm thấy ZaloPay',
                    text2: 'Vui lòng quét mã QR để thanh toán.',
                  });
                  navigation.navigate('QRCodeScreen', { qrContent: data.qr_code });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: 'Không có mã QR để thanh toán.',
                  });
                }
              }
            } catch (error) {
              console.error('Lỗi khi mở URL ZaloPay:', error);
              if (data.qr_code) {
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: 'Không thể mở ứng dụng ZaloPay. Vui lòng quét mã QR.',
                });
                navigation.navigate('QRCodeScreen', { qrContent: data.qr_code });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: 'Không thể mở ZaloPay và không có mã QR.',
                });
              }
            }
          } else {
            console.error('Invalid order_url:', data.order_url);
            Toast.show({
              type: 'error',
              text1: 'Lỗi',
              text2: 'URL thanh toán không hợp lệ hoặc không được cung cấp.',
            });
          }
        } else {
          // Xử lý COD
          Toast.show({
            type: 'success',
            text1: 'Đặt hàng thành công',
            text2: `Mã đơn hàng: ${data.order._id}`,
          });
          setCart([]);
          navigation.navigate('HomeScreen');
        }
      } else {
        console.error('placeOrder error:', data.error, data.details, data.sub_return_message);
        Toast.show({
          type: 'error',
          text1: 'Lỗi đặt hàng',
          text2: data.sub_return_message || data.details || data.error || 'Có lỗi xảy ra khi đặt hàng.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể tạo đơn hàng. Vui lòng kiểm tra kết nối mạng!',
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    await fetchBranches();
    setRefreshing(false);
  };

  const handleDecrease = () => {
    setRedeemPoints((prev) => {
      const currentPoints = parseInt(prev) || 1000;
      const newPoints = Math.max(1000, currentPoints - 1000);
      return newPoints.toString();
    });
  };

  const handleIncrease = () => {
    setRedeemPoints((prev) => {
      const currentPoints = parseInt(prev) || 0;
      const newPoints = Math.min(currentPoints + 1000, 5000);
      return newPoints.toString();
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Delivery Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức nhận hàng</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setDeliveryMethod('delivery')}
              >
                <RadioButton.Android
                  value="delivery"
                  status={deliveryMethod === 'delivery' ? 'checked' : 'unchecked'}
                />
                <Text style={styles.radioLabel}>Giao hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <RadioButton.Android
                  value="pickup"
                  status={deliveryMethod === 'pickup' ? 'checked' : 'unchecked'}
                />
                <Text style={styles.radioLabel}>Đến lấy tại cửa hàng</Text>
              </TouchableOpacity>
            </View>

            {deliveryMethod === 'delivery' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Địa chỉ nhận hàng</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MapScreen')}
                  style={styles.input}
                >
                  <Text style={address ? styles.addressText : styles.placeholderText}>
                    {address || 'Nhập địa chỉ giao hàng...'}
                  </Text>
                </TouchableOpacity>
                {address && route.params?.shippingDetails && (
                  <View style={styles.shippingDetails}>
                    <Text style={styles.shippingText}>
                      Phí vận chuyển: {shippingFee.toLocaleString()}đ
                    </Text>
                    <Text style={styles.shippingText}>
                      Khoảng cách: {route.params.shippingDetails.distance.toFixed(2)} km
                    </Text>
                    <Text style={styles.shippingText}>
                      Thời gian dự kiến: {route.params.shippingDetails.duration}
                    </Text>
                    <Text style={styles.shippingText}>
                      Chi nhánh giao: {route.params.shippingDetails.branch.name}
                    </Text>
                    <Text style={styles.shippingText}>
                      Địa chỉ chi nhánh: {route.params.shippingDetails.branch.address}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cửa hàng đến lấy</Text>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                  {branches.map((item, index) => (
                    <TouchableOpacity
                      key={item._id || index}
                      style={styles.branchItem}
                      onPress={() => setSelectedBranch(item)}
                    >
                      <Text
                        style={[
                          styles.branchText,
                          selectedBranch && selectedBranch._id === item._id
                            ? styles.selectedBranch
                            : null,
                        ]}
                      >
                        {item.name} - {item.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedBranch && (
                  <Text style={styles.customerInfo}>Chi nhánh đã chọn: {selectedBranch.name}</Text>
                )}
                <TouchableOpacity onPress={() => setVisible(true)}>
                  <Text style={styles.label}>
                    Chọn thời gian đến lấy: {`${pickupTime.hours}:${pickupTime.minutes
                      .toString()
                      .padStart(2, '0')}`}
                  </Text>
                </TouchableOpacity>
                <TimePickerModal
                  visible={visible}
                  onDismiss={onDismiss}
                  onConfirm={onConfirm}
                  hours={pickupTime.hours}
                  minutes={pickupTime.minutes}
                />
              </View>
            )}
          </View>

          {/* Order Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
            {cart.length > 0 ? (
              cart.map((item) => {
                const basePrice = item.productId?.price?.[item.size] || 0;
                const toppingPrice = item.toppings.reduce(
                  (sum, topping) => sum + (topping.toppingId?.price || 0) * topping.quantity,
                  0
                );
                const itemTotalPrice = (basePrice + toppingPrice) * item.quantity;

                return (
                  <View key={item._id} style={styles.orderItem}>
                    <Image source={{ uri: item.productId?.imageUrl }} style={styles.productImage} />
                    <View style={styles.orderDetails}>
                      <Text style={styles.orderText}>
                        {item.productId?.name || 'Sản phẩm không xác định'}
                      </Text>
                      <Text style={styles.orderDescription}>Size: {item.size}</Text>
                      <Text style={styles.orderDescription}>Số lượng: {item.quantity}</Text>
                      <Text style={styles.orderDescription}>
                        Đá: {item.iceLevel} - Đường: {item.sweetLevel}
                      </Text>
                      {item.toppings.length > 0 && (
                        <View style={styles.toppingContainer}>
                          <Text style={styles.toppingTitle}>Toppings:</Text>
                          {item.toppings.map((topping) => (
                            <Text key={topping._id} style={styles.toppingText}>
                              + {topping.toppingId.name} ({topping.toppingId.price.toLocaleString()}đ) x
                              {topping.quantity}
                            </Text>
                          ))}
                        </View>
                      )}
                      <Text style={styles.orderPrice}>{itemTotalPrice.toLocaleString()}đ</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text>Giỏ hàng trống</Text>
            )}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Tổng cộng</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
            </View>
          </View>

          {/* Promotion Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến mãi</Text>
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã khuyến mãi"
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  if (!text) setDiscountPrice(0);
                }}
              />
              <TouchableOpacity style={styles.applyButton} onPress={applyDiscount}>
                <Text style={styles.applyButtonText}>Chọn</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Points Redemption Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quy đổi điểm</Text>
            <View style={styles.promoContainer}>
              <TouchableOpacity
                style={[styles.adjustButton, styles.decreaseButton]}
                onPress={handleDecrease}
              >
                <Icon name="minus" size={18} color="#e74c3c" />
              </TouchableOpacity>

              <TextInput
                style={[styles.inputPoint, { textAlign: 'center' }]}
                value={redeemPoints.toString()}
                editable={false}
              />

              <TouchableOpacity
                style={[styles.adjustButton, styles.increaseButton]}
                onPress={handleIncrease}
              >
                <Icon name="plus" size={18} color="#2ecc71" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyButton} onPress={previewRedeemPoints}>
                <Text style={styles.applyButtonText}>Ước tính</Text>
              </TouchableOpacity>
            </View>

            {pointsDiscount > 0 && (
              <Text style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: 5 }}>
                Sẽ giảm {pointsDiscount.toLocaleString()}đ từ điểm thưởng
              </Text>
            )}
          </View>

          {/* Total Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tổng cộng</Text>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Thành tiền</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            {['COD', 'Ví ZaloPay'].map((method, index) => (
              <TouchableOpacity
                key={index}
                style={styles.radioButton}
                onPress={() => setSelectedPayment(method)}
              >
                <RadioButton.Android
                  value={method}
                  status={selectedPayment === method ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedPayment(method)}
                />
                <Text style={styles.radioLabel}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              placeholder="Ghi chú cho đơn hàng..."
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Place Order Button */}
          <TouchableOpacity style={styles.orderButton} onPress={placeOrder}>
            <Text style={styles.orderButtonText}>Đặt hàng</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 50,
    paddingBottom: 80,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8F8',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabel: {
    fontSize: 15,
    color: '#555',
  },
  inputContainer: {
    marginTop: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  shippingDetails: {
    marginTop: 10,
  },
  shippingText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
  },
  branchItem: {
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  branchText: {
    fontSize: 14,
    color: '#444',
  },
  selectedBranch: {
    fontWeight: 'bold',
    color: '#FF6347',
  },
  customerInfo: {
    fontSize: 13,
    color: 'gray',
    marginTop: 6,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  productImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    marginRight: 18,
  },
  orderDetails: {
    flex: 1,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDescription: {
    fontSize: 14,
    color: 'gray',
    marginVertical: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6347',
  },
  toppingContainer: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderColor: '#FFA500',
  },
  toppingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  toppingText: {
    fontSize: 15,
    color: '#555',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginLeft: 12,
    shadowColor: '#FF6347',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  totalText: {
    fontSize: 16,
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6347',
  },
  orderButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FF6347',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  adjustButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  decreaseButton: {
    borderColor: '#e74c3c',
  },
  increaseButton: {
    borderColor: '#2ecc71',
  },
  inputPoint: {
    width: 120,
    height: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
});

export default OrderScreen;