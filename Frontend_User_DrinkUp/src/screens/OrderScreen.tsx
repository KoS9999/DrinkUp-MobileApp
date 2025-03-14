import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, FlatList, Platform } from "react-native";
import { RadioButton } from "react-native-paper";
import { API_BASE_URL } from "../config/api";

const OrderScreen = () => {
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [address, setAddress] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

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

  return (
    <FlatList
      data={["header"]}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.listContainer}
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
              </View>
            )}
          </View>

          {/* Tóm tắt đơn hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
            <View style={styles.orderItem}>
              <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.productImage} />
              <View style={styles.orderDetails}>
                <Text style={styles.orderText}>Combo Lấp Lánh - Trà Sữa Chôm Chôm</Text>
                <Text style={styles.orderDescription}>Size L, ít cà phê, ngọt vừa</Text>
                <Text style={styles.orderPrice}>169,000đ</Text>
              </View>
            </View>
          </View>
          {/* Khuyến mãi */}
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Khuyến mãi</Text>
              <View style={styles.promoContainer}>
                <TextInput style={styles.input} placeholder="Nhập mã khuyến mãi" value={promoCode} onChangeText={setPromoCode} />
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>Chọn</Text>
                </TouchableOpacity>
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
                <Text style={styles.totalPrice}>169,000đ</Text>
              </View>
              <TextInput style={styles.input} placeholder="Ghi chú cho đơn hàng..." />
            </View>

          {/* Nút đặt hàng */}
          <TouchableOpacity style={styles.orderButton}>
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
