import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigators/AppNavigator";

type Order = {
  _id: string;
  finalPrice: number;
  orderStatus: string;
  createdAt: string;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "OrderHistoryScreen">;

const OrderHistoryScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`${API_BASE_URL}/user/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
      } else {
        console.error("Lỗi lấy lịch sử đơn hàng:", data.error);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Lịch Sử Đơn Hàng</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#D2691E" />
      ) : orders.length === 0 ? (
        <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào!</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetailScreen", { orderId: item._id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>🆔 {item._id.slice(-6).toUpperCase()}</Text>
                <Text style={[styles.orderStatus, getStatusStyle(item.orderStatus)]}>
                  {getStatusLabel(item.orderStatus)}
                </Text>
              </View>
              <View style={styles.orderBody}>
                <Text style={styles.orderText}>💰 Tổng tiền: {item.finalPrice.toLocaleString()}đ</Text>
                <Text style={styles.orderText}>📅 Ngày đặt: {new Date(item.createdAt).toLocaleDateString("vi-VN")}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: "🆕 Mới",
    processing: "🔄 Đang xử lý",
    confirmed: "✅ Đã xác nhận",
    shipped: "🚚 Đang giao",
    delivered: "📦 Đã nhận",
    canceled: "❌ Đã hủy",
  };
  return labels[status] || "❔ Không xác định";
};

const getStatusStyle = (status: string) => {
  return {
    color:
      status === "delivered" ? "#28A745" :
      status === "canceled" ? "#DC3545" :
      status === "shipped" ? "#007BFF" :
      status === "processing" ? "#FFC107" :
      "#6F4E37",
  };
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 55, paddingBottom: 55, backgroundColor: "#F8F8F8" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15, color: "#6F4E37" },
  emptyText: { fontSize: 18, color: "#777", textAlign: "center", marginTop: 20 },

  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#6F4E37" },
  orderStatus: { fontSize: 14, fontWeight: "bold" },

  orderBody: { marginTop: 5 },
  orderText: { fontSize: 16, color: "#333", marginBottom: 5 },
});

export default OrderHistoryScreen;
