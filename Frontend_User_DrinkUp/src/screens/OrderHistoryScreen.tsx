import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigators/AppNavigator";
import CustomAlert  from "../components/CustomAlert";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Toast from 'react-native-toast-message';

const Tab = createMaterialTopTabNavigator();

const ORDER_STATUSES = [
  "new",
  "processing",
  "confirmed",
  "shipped",
  "delivered",
  "canceled",
  "cancel_request",
];

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Mới",
  processing: "🔄 Đang xử lý",
  confirmed: "✅ Đã xác nhận",
  shipped: "🚚 Đang giao",
  delivered: "📦 Đã nhận",
  canceled: "❌ Đã hủy",
  cancel_request: "⏳ Yêu cầu hủy",
};

const STATUS_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  delivered: { backgroundColor: "#D4EDDA", color: "#28A745" },
  canceled: { backgroundColor: "#F8D7DA", color: "#DC3545" },
  shipped: { backgroundColor: "#D1ECF1", color: "#007BFF" },
  processing: { backgroundColor: "#FFF3CD", color: "#FFC107" },
  cancel_request: { backgroundColor: "#FCE8B2", color: "#FF8C00" },
  new: { backgroundColor: "#E2E3E5", color: "#6C757D" },
  confirmed: { backgroundColor: "#CCE5FF", color: "#004085" },
};

const OrderTabScreen = ({ status }: { status: string }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<number>(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", message: "", type: "success" });

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
  
      const response = await fetch(`${API_BASE_URL}/user/orders/history-with-summary?status=${status}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        const sortedOrders = (data.orders || []).sort(
          (a: { createdAt: string | number | Date; }, b: { createdAt: string | number | Date; }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
        const total = data.summary?.[status]?.totalAmount || 0;
        setSummary(total);
      }      
    } catch (err) {
      console.error("Lỗi fetchData:", err);
      setOrders([]);
      setSummary(0);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`${API_BASE_URL}/user/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
      if (response.ok) {
        setAlertContent({ title: "Thành công", message: data.message, type: "success" });
        setAlertVisible(true);
        fetchData();
      } else {
        setAlertContent({ title: "Lỗi", message: data.message, type: "error" });
        setAlertVisible(true);
      }
    } catch (err) {
      setAlertContent({ title: "Lỗi", message: "Có lỗi xảy ra", type: "error" });
      setAlertVisible(true);
    }
  };
  

  const handlePress = (orderId: string) => {
    navigation.navigate("OrderDetailScreen", { orderId });
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.totalText}>Tổng tiền: {summary.toLocaleString()}đ</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6F4E37" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item._id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePress(item._id)}>
              <View style={styles.orderCard}>
                <View style={[
                  styles.statusContainer,
                  { backgroundColor: STATUS_STYLE[item.orderStatus].backgroundColor }
                ]}>
                  <Text style={[
                    styles.orderStatus,
                    { color: STATUS_STYLE[item.orderStatus].color }
                  ]}>
                    {STATUS_LABELS[item.orderStatus]}
                  </Text>
                </View>
  
                <View style={styles.orderBody}>
                  <Text style={styles.orderText}>
                    💰 {item.finalPrice.toLocaleString()}đ
                  </Text>
                  <Text style={styles.orderText}>
                    📅 {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                  <Text style={styles.orderText}>
                    🆔 Mã đơn: <Text style={styles.highlightText}>{item._id}</Text>
                  </Text>
                </View>
  
                {item.orderStatus === "new" || item.orderStatus === "processing" ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelOrder(item._id)}
                  >
                    <Text style={styles.cancelButtonText}>❌ Hủy đơn</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
  
      {/* Hiển thị CustomAlert nếu cần */}
      <CustomAlert
        isVisible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        type={alertContent.type as "success" | "error"}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
  
};

const OrderHistoryTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarIndicatorStyle: { backgroundColor: "#6F4E37" },
        tabBarStyle: { backgroundColor: "#fff",paddingTop: 35 },
        tabBarLabelStyle: { fontWeight: "bold", color: "#6F4E37" },
      }}
    >
      {ORDER_STATUSES.map((status) => (
        <Tab.Screen
          key={status}
          name={STATUS_LABELS[status] || status}
          children={() => <OrderTabScreen status={status} />}
        />
      ))}
    </Tab.Navigator>
  );
};

export default OrderHistoryTabs;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8", paddingTop: 15, paddingBottom: 65 },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6F4E37",
    textAlign: "center",
    marginVertical: 10,
  },
  orderCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 10,
    shadowColor: "#6F4E37",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orderBody: {
    marginTop: 5,
  },
  orderText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 3,
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  highlightText: {
    fontWeight: "bold",
    color: "#6F4E37",
  },
  
});
