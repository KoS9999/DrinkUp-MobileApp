import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native";
import { RadioButton } from "react-native-paper";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimePickerModal } from "react-native-paper-dates";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigators/AppNavigator";

type NavigationProps = BottomTabNavigationProp<TabParamList, "AccountTab">; 
const getAuthToken = async () => {
  return await AsyncStorage.getItem("userToken");
};

type Product = {
  _id: string;
  name: string;
  imageUrl: string;
  price: Record<string, number>;
}

type CartItem = {
  _id: string;
  productId: Product;
  quantity: number;
  size: string;
}

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
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    fetchCart();
    fetchBranches();
  }, []);

  useEffect(() => {
    setTotalPrice(originalTotalPrice - discountPrice);
  }, [originalTotalPrice, discountPrice]);

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

      if (response.ok) {
        const items: CartItem[] = data.items || [];
        setCart(items);
        const total = items.reduce((sum: number, item: CartItem) => {
          const price = item.productId?.price?.[item.size] || 0;
          return sum + price * (item.quantity || 0);
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

  const applyDiscount = async () => {
    if (!promoCode.trim()) {
      setDiscountPrice(0);
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
        alert(data.message);
      } else {
        alert(data.error || "Mã giảm giá không hợp lệ");
        setDiscountPrice(0);
      }
    } catch (error) {
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
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
      };
  
      console.log("Gửi request đặt hàng:", orderData);
  
      const response = await fetch(`${API_BASE_URL}/order/create/cod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
  
      const text = await response.text();
      console.log("API Response:", text);
  
      try {
        const data = JSON.parse(text);
        if (response.ok) {
          alert("Đặt hàng thành công!\nMã đơn hàng: " + data.order._id);
          // Xóa giỏ hàng trên client
          setCart([]);
        
          navigation.navigate("AccountTab");  
        } else {
          alert(`Lỗi: ${data.error || "Có lỗi xảy ra khi đặt hàng."}`);
        }
      } catch (jsonError) {
        console.error("Lỗi JSON Parse:", jsonError);
        alert("Lỗi khi xử lý dữ liệu từ server. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      alert("Không thể tạo đơn hàng. Vui lòng kiểm tra kết nối mạng!");
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true); 
    await fetchCart(); 
    await fetchBranches(); 
    setRefreshing(false); 
  };
  

  return (
    <FlatList
      data={["header"]}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.listContainer}
      keyboardShouldPersistTaps="handled"
      refreshing={refreshing} 
      onRefresh={onRefresh}
      renderItem={() => (
        <>
          {/* Phương thức nhận hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức nhận hàng</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioButton} onPress={() => setDeliveryMethod("delivery")}>
                <RadioButton.Android value="delivery" status={deliveryMethod === "delivery" ? "checked" : "unchecked"} onPress={() => setDeliveryMethod("delivery")} />
                <Text style={styles.radioLabel}>Giao hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioButton} onPress={() => setDeliveryMethod("pickup")}>
                <RadioButton.Android value="pickup" status={deliveryMethod === "pickup" ? "checked" : "unchecked"} onPress={() => setDeliveryMethod("pickup")} />
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
                <FlatList
                  data={branches}
                  keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.branchItem} onPress={() => setSelectedBranch(item)}>
                      <Text style={[styles.branchText, selectedBranch && selectedBranch._id === item._id ? styles.selectedBranch : null]}>
                        {item.name} - {item.address}
                      </Text>
                    </TouchableOpacity>
                  )}
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 200 }}
                />
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
              cart.map((item) => (
                <View key={item._id} style={styles.orderItem}>
                  <Image source={{ uri: item.productId?.imageUrl}} style={styles.productImage} />
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderText}>{item.productId?.name || "Sản phẩm không xác định"}</Text>
                    <Text style={styles.orderDescription}>Số lượng: {item.quantity || 0}</Text>
                    <Text style={styles.orderPrice}>{(item.productId?.price?.[item.size] || 0).toLocaleString()}đ</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text>Giỏ hàng trống</Text>
            )}
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
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 50, 
    paddingBottom: 100, 
    paddingHorizontal: 15,
    backgroundColor: "#F8F8F8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 15,
  },
  
  scrollView: {
    paddingTop: 55,  
    paddingBottom: 125, 
    paddingHorizontal: 15, 
  },
  
  section: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  inputContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F1F1F1",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    flex: 1,
  },
  branchItem: {
    padding: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 5,
    marginVertical: 5,
  },
  branchText: {
    fontSize: 14,
  },
  selectedBranch: {
    fontWeight: "bold",
    color: "#D2691E",
  },
  customerInfo: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  orderDetails: {
    flex: 1,
  },
  orderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  orderDescription: {
    fontSize: 12,
    color: "gray",
    marginVertical: 5,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D2691E",
  },
  promoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#D2691E",
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  applyButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  totalText: {
    fontSize: 14,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D2691E",
  },
  orderButton: {
    backgroundColor: "#D2691E",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  orderButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default OrderScreen;
