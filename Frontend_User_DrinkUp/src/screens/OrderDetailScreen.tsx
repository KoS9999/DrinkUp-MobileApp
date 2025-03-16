import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from "react-native";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigators/AppNavigator";

type Topping = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderDetail = {
  product: { name: string; imageUrl: string };
  quantity: number;
  size: string;
  price: number;
  toppings: Topping[];
  iceLevel: string;
  sweetLevel: string;
};

type OrderInfo = {
  _id: string;
  finalPrice: number;
  orderStatus: string;
  createdAt: string;
  couponCode?: string | null;
};

type RouteParams = RouteProp<RootStackParamList, "OrderDetailScreen">;

const OrderDetailScreen: React.FC = () => {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute<RouteParams>();

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("Lỗi: Không tìm thấy token!");
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/user/orders/${route.params.orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
      console.log("API Response (Order Details):", JSON.stringify(data, null, 2)); 
  
      if (response.ok && data.order && data.orderDetails) {
        setOrder(data.order);
        setOrderDetails(data.orderDetails);
      } else {
        console.error("Lỗi lấy chi tiết đơn hàng:", data.error || "Dữ liệu không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#D2691E" />
      ) : (
        <>
          <Text style={styles.title}>Chi Tiết Đơn Hàng</Text>
          {order && (
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderText}>🆔 Mã đơn: <Text style={styles.highlightText}>{order._id}</Text></Text>
              <Text style={styles.orderText}>📦 Trạng thái: <Text style={styles.highlightText}>{order.orderStatus}</Text></Text>
              <Text style={styles.orderText}>💰 Tổng tiền: <Text style={styles.highlightText}>{order.finalPrice.toLocaleString()}đ</Text></Text>
              {order.couponCode && (
                <Text style={styles.couponText}>🎟 Mã giảm giá: {order.couponCode}</Text>
              )}
              <Text style={styles.orderText}>📅 Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</Text>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>🛒 Sản phẩm đã đặt</Text>
          <FlatList
            data={orderDetails}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              const toppingPrice = item.toppings.reduce((sum, topping) => sum + topping.price * topping.quantity, 0);
              const totalItemPrice = (item.price + toppingPrice) * item.quantity;

              return (
                <View style={styles.productCard}>
                  <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <Text style={styles.productDetails}>☕ Kích thước: {item.size}</Text>
                    <Text style={styles.productDetails}>🔢 Số lượng: {item.quantity}</Text>
                    <Text style={styles.productDetails}>🧊 Đá: {item.iceLevel} - 🍯 Đường: {item.sweetLevel}</Text>

                    {/* Hiển thị danh sách toppings nếu có */}
                    {item.toppings.length > 0 && (
                        <View style={styles.toppingContainer}>
                          <Text style={styles.toppingTitle}>🌟 Toppings:</Text>
                          {item.toppings.map((topping) => (
                            <Text key={topping._id} style={styles.toppingText}>
                              + {topping.name} ({topping.price.toLocaleString()}đ) x{topping.quantity}
                            </Text>
                          ))}
                        </View>
                    )}


                    <Text style={styles.productPrice}>💲 Giá tổng: {totalItemPrice.toLocaleString()}đ</Text>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 55, backgroundColor: "#F8F8F8" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15, color: "#6F4E37" },

  orderInfoCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#6F4E37",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  orderText: { fontSize: 16, marginBottom: 5, color: "#333" },
  highlightText: { fontWeight: "bold", color: "#D2691E" },
  couponText: { fontSize: 16, color: "#D2691E", fontWeight: "bold", marginTop: 5 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6F4E37",
    marginBottom: 10,
  },

  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#6F4E37",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80, 
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "bold", color: "#6F4E37" },
  productDetails: { fontSize: 14, color: "#555", marginTop: 5 },
  toppingContainer: { marginTop: 5, paddingLeft: 5, borderLeftWidth: 2, borderColor: "#FFA500" },
  toppingTitle: { fontSize: 14, fontWeight: "bold", color: "#D2691E" },
  toppingText: { fontSize: 14, color: "#555" },
  productPrice: { fontSize: 16, fontWeight: "bold", color: "#D2691E", marginTop: 5 },
});

export default OrderDetailScreen;
