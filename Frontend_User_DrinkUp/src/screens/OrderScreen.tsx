import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, 
   KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, RefreshControl  } from "react-native";
import { RadioButton } from "react-native-paper";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimePickerModal } from "react-native-paper-dates";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigators/AppNavigator";
import Toast from "react-native-toast-message";


type NavigationProps = BottomTabNavigationProp<TabParamList, "AccountTab">;
const getAuthToken = async () => {
  return await AsyncStorage.getItem("userToken");
};

type Topping = {
  _id: string;
  toppingId: {
    _id: any;
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
  size: "S" | "M" | "L";
  iceLevel: string;
  sweetLevel: string;
  toppings: Topping[];
};


const OrderScreen: React.FC = () => {
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountPrice, setDiscountPrice] = useState(0);
  const [address, setAddress] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [pickupTime, setPickupTime] = useState<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 });
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProps>();
  const parsedRedeemPoints = parseInt(redeemPoints) || 0;
  

  useEffect(() => {
    fetchCart();
    fetchBranches();
  }, []);

  useEffect(() => {
  setTotalPrice(originalTotalPrice - discountPrice - pointsDiscount);
}, [originalTotalPrice, discountPrice, pointsDiscount]);

  const fetchCart = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("API Response (OrderScreen):", data);

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
          const toppingPrice = item.toppings.reduce((tSum, topping) => tSum + (topping.toppingId?.price || 0) * topping.quantity, 0);
          return sum + (basePrice + toppingPrice) * item.quantity;
        }, 0);

        setOriginalTotalPrice(total);
      } else {
        console.error("Lỗi khi lấy giỏ hàng:", data.error);
      }
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/order/branches`);
      const data = await response.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
      } else {
        console.error("Dữ liệu trả về không hợp lệ:", data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chi nhánh:", error);
    }
  };

  const previewRedeemPoints = async () => {
    const parsedPoints = parseInt(redeemPoints);
  
    if (!parsedPoints || parsedPoints % 1000 !== 0) {
      Toast.show({
        type: "error",
        text1: "Điểm không hợp lệ",
        text2: "Chỉ được quy đổi bội số của 1000 điểm.",
      });
      return;
    }
  
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/order/redeem-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ points: parsedPoints }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        setPointsDiscount(data.discountValue);
        setTotalPrice(originalTotalPrice - discountPrice - data.discountValue);
        Toast.show({
          type: "success",
          text1: "Ước tính giảm giá thành công!",
          text2: `Sẽ giảm ${data.discountValue.toLocaleString()}đ khi thanh toán.`,
        });
      } else {
        setPointsDiscount(0);
        Toast.show({
          type: "error",
          text1: "Không thể quy đổi",
          text2: data.error || "Vui lòng kiểm tra lại điểm bạn đã nhập.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi xem điểm quy đổi:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể kết nối tới server.",
      });
    }
  };
  
  const applyDiscount = async () => {
    if (!promoCode.trim()) {
      setDiscountPrice(0);
      Toast.show({
        type: "info",
        text1: "Mã khuyến mãi trống",
        text2: "Vui lòng nhập mã trước khi áp dụng.",
      });
      return;
    }
  
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/order/apply-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ couponCode: promoCode }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        setDiscountPrice(data.discountPrice);
        Toast.show({
          type: "success",
          text1: "Áp dụng mã thành công!",
          text2: `${data.message || "Bạn đã được giảm giá."}`,
        });
      } else {
        setDiscountPrice(0);
        Toast.show({
          type: "error",
          text1: "Mã không hợp lệ",
          text2: data.error || "Không thể áp dụng mã khuyến mãi này.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể áp dụng mã giảm giá. Vui lòng kiểm tra kết nối mạng.",
      });
    }
  };
  
  const onDismiss = () => {
    setVisible(false);
  };

  const onConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setPickupTime({ hours, minutes });
    setVisible(false);
  };

  const placeOrder = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
  
      const orderData = {
        orderType: deliveryMethod,
        branchId: deliveryMethod === "pickup" ? selectedBranch?._id : null,
        deliveryAddress: deliveryMethod === "delivery" ? address : null,
        couponCode: promoCode || null,
        paymentMethod: selectedPayment.toLowerCase() === "cod" ? "cod" : "zaloPay",
        note: note || "",
        redeemPoints: parsedRedeemPoints,  // Đảm bảo giá trị `redeemPoints` được gửi đi
        cartItems: cart.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          size: item.size,
          iceLevel: item.iceLevel,
          sweetLevel: item.sweetLevel,
          toppings: item.toppings.map((t) => ({
            toppingId: t.toppingId._id,
            name: t.toppingId.name,
            price: t.toppingId.price,
            quantity: t.quantity,
          })),
        })),
      };
  
      const response = await fetch(`${API_BASE_URL}/order/create/cod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Đặt hàng thành công",
          text2: `Mã đơn hàng: ${data.order._id}`,
        });
        setCart([]);
        navigation.navigate("AccountTab");
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi đặt hàng",
          text2: data.error || "Có lỗi xảy ra khi đặt hàng.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể tạo đơn hàng. Vui lòng kiểm tra kết nối mạng!",
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
    setRedeemPoints(prev => {
      const currentPoints = parseInt(prev) || 1000; 
      const newPoints = Math.max(1000, currentPoints - 1000); 
      return newPoints.toString();
    });
  };

  const handleIncrease = () => {
    setRedeemPoints(prev => {
      const currentPoints = parseInt(prev) || 0; 
      const newPoints = currentPoints + 1000;
      return newPoints.toString(); 
    });
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Phương thức nhận hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức nhận hàng</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioButton} onPress={() => setDeliveryMethod("delivery")}>
                <RadioButton.Android value="delivery" status={deliveryMethod === "delivery" ? "checked" : "unchecked"} />
                <Text style={styles.radioLabel}>Giao hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioButton} onPress={() => setDeliveryMethod("pickup")}>
                <RadioButton.Android value="pickup" status={deliveryMethod === "pickup" ? "checked" : "unchecked"} />
                <Text style={styles.radioLabel}>Đến lấy tại cửa hàng</Text>
              </TouchableOpacity>
            </View>

            {deliveryMethod === "delivery" ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Địa chỉ nhận hàng</Text>
                <TextInput style={styles.input} placeholder="Nhập địa chỉ giao hàng..." value={address} onChangeText={setAddress} />
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
                  <Text style={styles.label}>Chọn thời gian đến lấy: {`${pickupTime.hours} : ${pickupTime.minutes.toString().padStart(2, '0')}`}</Text>
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

  
          {/* Tóm tắt đơn hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
            {cart.length > 0 ? (
              cart.map((item) => {
                const basePrice = item.productId?.price?.[item.size] || 0;
                const toppingPrice = item.toppings.reduce((sum, topping) => sum + (topping.toppingId?.price || 0) * topping.quantity, 0);
                const itemTotalPrice = (basePrice + toppingPrice) * item.quantity;
  
                return (
                  <View key={item._id} style={styles.orderItem}>
                    {/* Hình ảnh sản phẩm */}
                    <Image source={{ uri: item.productId?.imageUrl }} style={styles.productImage} />
                    <View style={styles.orderDetails}>
                      {/* Tên sản phẩm */}
                      <Text style={styles.orderText}>{item.productId?.name || "Sản phẩm không xác định"}</Text>
                      {/* Kích cỡ */}
                      <Text style={styles.orderDescription}>Size: {item.size}</Text>
                      {/* Số lượng */}
                      <Text style={styles.orderDescription}>Số lượng: {item.quantity}</Text>
                      {/* Độ đá & đường */}
                      <Text style={styles.orderDescription}>Đá: {item.iceLevel} - Đường: {item.sweetLevel}</Text>
  
                      {/* Hiển thị danh sách toppings nếu có */}
                      {item.toppings.length > 0 && (
                        <View style={styles.toppingContainer}>
                          <Text style={styles.toppingTitle}>Toppings:</Text>
                          {item.toppings.map((topping) => (
                            <Text key={topping._id} style={styles.toppingText}>
                              + {topping.toppingId.name} ({topping.toppingId.price.toLocaleString()}đ) x{topping.quantity}
                            </Text>
                          ))}
                        </View>
                      )}
  
                      {/* Giá tổng cho từng sản phẩm */}
                      <Text style={styles.orderPrice}>{itemTotalPrice.toLocaleString()}đ</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text>Giỏ hàng trống</Text>
            )}
  
            {/* Tổng tiền đơn hàng */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Tổng cộng</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
            </View>
          </View>
  
          {/* Khuyến mãi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến mãi</Text>
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã khuyến mãi"
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  if (!text) {
                    setDiscountPrice(0);
                  }
                }}
              />
              <TouchableOpacity style={styles.applyButton} onPress={applyDiscount}>
                <Text style={styles.applyButtonText}>Chọn</Text>
              </TouchableOpacity>
            </View>
          </View>
  
          {/* Quy đổi điểm (ước tính) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến mãi</Text>
            <View style={styles.promoContainer}>
              {/* Nút giảm số điểm */}
              <TouchableOpacity
                style={[styles.adjustButton, styles.decreaseButton]}
                onPress={handleDecrease} // Sử dụng handleDecrease để giảm điểm
              >
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
  
              {/* Hiển thị số điểm quy đổi */}
              <TextInput
                style={[styles.input, { textAlign: 'center' }]} // Căn giữa số điểm
                value={redeemPoints.toString()} // Hiển thị redeemPoints
                editable={false} // Không cho phép người dùng chỉnh sửa trực tiếp
              />
  
              {/* Nút tăng số điểm */}
              <TouchableOpacity
                style={[styles.adjustButton, styles.increaseButton]}
                onPress={handleIncrease} // Sử dụng handleIncrease để tăng điểm
              >
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
  
              {/* Nút Ước tính */}
              <TouchableOpacity style={styles.applyButton} onPress={previewRedeemPoints}>
                <Text style={styles.applyButtonText}>Ước tính</Text>
              </TouchableOpacity>
            </View>
  
            {pointsDiscount > 0 && (
              <Text style={{ color: "#2ecc71", fontWeight: "bold", marginTop: 5 }}>
                Sẽ giảm {pointsDiscount.toLocaleString()}đ từ điểm thưởng
              </Text>
            )}
          </View>
  
          {/* Tổng cộng tiền */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tổng cộng</Text>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Thành tiền</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
            </View>
          </View>
  
          {/* Phương thức thanh toán */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            {["COD", "Ví ZaloPay"].map((method, index) => (
              <TouchableOpacity key={index} style={styles.radioButton} onPress={() => setSelectedPayment(method)}>
                <RadioButton.Android
                  value={method}
                  status={selectedPayment === method ? "checked" : "unchecked"}
                  onPress={() => setSelectedPayment(method)}
                />
                <Text style={styles.radioLabel}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
  
          {/* Tổng cộng tiền và ghi chú */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tổng cộng</Text>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Thành tiền</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ghi chú cho đơn hàng..."
              value={note}
              onChangeText={setNote}
            />
          </View>
  
          {/* Nút đặt hàng */}
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
    backgroundColor: "#F8F8F8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
  },

  scrollView: {
    paddingTop: 50,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },

  section: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  radioLabel: {
    fontSize: 15,
    color: "#555",
  },
  inputContainer: {
    marginTop: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  input: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  branchItem: {
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  branchText: {
    fontSize: 14,
    color: "#444",
  },
  selectedBranch: {
    fontWeight: "bold",
    color: "#FF6347",
  },
  customerInfo: {
    fontSize: 13,
    color: "gray",
    marginTop: 6,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    color: "#333",
  },
  orderDescription: {
    fontSize: 14,
    color: "gray",
    marginVertical: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6347",
  },

  toppingContainer: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderColor: "#FFA500",
  },
  toppingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FF6347",
  },
  toppingText: {
    fontSize: 15,
    color: "#555",
  },
  promoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginLeft: 12,
    shadowColor: "#FF6347",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  applyButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  totalText: {
    fontSize: 16,
    color: "#333",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6347",
  },
  orderButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#FF6347",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  orderButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  adjustButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 25,
  },
  decreaseButton: {
    backgroundColor: "#e74c3c", 
  },
  increaseButton: {
    backgroundColor: "#2ecc71", 
  },
  buttonText: {
    fontSize: 25,
    color: "#FFF",
    fontWeight: "700",
  },
});


export default OrderScreen;
