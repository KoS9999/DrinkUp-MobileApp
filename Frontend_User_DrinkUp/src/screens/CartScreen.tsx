import React, { useEffect, useState } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Button, Modal } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../components/CartContext";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import Toast from "react-native-toast-message";
import { FlatList } from "react-native";


type Product = {
  _id: string;
  productId: {
    name: string;
    price: { S: number; M: number; L: number };
    imageUrl: string;
  };
  quantity: number;
  size: "S" | "M" | "L";
  toppings: {
    _id: string;
    toppingId: {
      name: string;
      price: number;
    };
    quantity: number;
  }[];
  iceLevel: string;
  sweetLevel: string;
};

type CartData = {
  _id: string;
  userId: string;
  items: Product[];
  updatedAt: string;
};

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CartScreen'>;

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) {
    console.error("Missing token");
  }
  console.log("Token:", token);
  return token;
};

// const products: Product[] = [
//   {
//     id: 1,
//     name: "TRÀ ĐÀO HỒNG ĐÀI",
//     size: "Size L",
//     description: "Đá bình thường, Ngọt bình thường",
//     price: 64000,
//     quantity: 1,
//     image: "https://cdn.shopify.com/s/files/1/0537/9997/files/tra_dao_bao_nhieu_calo_cach_uong_tra_dao_khong_bi_tang_can_1_480x480.jpg?v=1695697682"
//   },
//   {
//     id: 2,
//     name: "TRÀ VẢI",
//     size: "Size L",
//     description: "Ngọt bình thường, Đá bình thường",
//     price: 54000,
//     quantity: 1,
//     image: "https://micaynagathuduc.com/wp-content/uploads/2022/07/sinh-to-vai-osterberg.jpg"
//   },
//   {
//     id: 3,
//     name: "TRÀ CÓC",
//     size: "Size L",
//     description: "Ngọt bình thường, Ít đá",
//     price: 69000,
//     quantity: 1,
//     image: "https://katinat.vn/wp-content/uploads/2024/04/432783099_402994675762732_8827534077984566267_n.jpg"
//   }
// ];

const CartScreen: React.FC = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchCart = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok || response.status === 404) {
        setCart(data);
      } else {
        Toast.show({
          type: "info",
          text1: "Thông báo",
          text2: "Bạn chưa có sản phẩm nào trong giỏ hàng 👀",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const calculateTotalAmount = () => {
    if (!cart?.items || cart.items.length === 0) return 0;

    return cart?.items.reduce((total, item) => {
      const itemPrice = (item.productId.price[item.size] +
        item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0)
      ) * item.quantity;

      return total + itemPrice;
    }, 0)
  }

  const removeFromCart = async (itemId: string) => {
    try {
      //await fetch(`API_URL/cart/remove`, {
      await fetch(`${API_BASE_URL}/cart/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      fetchCart(); // Tải lại giỏ hàng sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingBottom: 100 }}>
      <FlatList
        data={cart?.items || []} // Dữ liệu giỏ hàng
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Giỏ hàng</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Bạn có {cart?.items.length || 0} sản phẩm trong giỏ hàng</Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Tải lại Giỏ hàng"
                onPress={fetchCart}
                disabled={loading}
                color="#4e9eed"
              />
            </View>
          </>
        }
        ListFooterComponent={
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>{cart?.items.length} sản phẩm</Text>
              <Text style={styles.totalAmount}>{calculateTotalAmount().toLocaleString("vi-VN")}đ</Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate("OrderScreen")}>
              <Text style={styles.continueText}>Tiếp tục</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) =>
          item.productId ? (
            <View style={styles.productContainer}>
              <Image source={{ uri: item.productId.imageUrl }} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{item.productId.name}</Text>
                <Text style={styles.productSize}>Size {item.size}</Text>

                {/* Nút Xóa (icon X) */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    const id = setSelectedItem(item._id);
                    console.log("ID là:", id);
                    setModalVisible(true);
                  }}
                >
                  <AntDesign name="closecircleo" size={24} color="#c23a41" />
                </TouchableOpacity>

                <Text style={styles.productDescription}>Đá: {item.iceLevel}, Đường: {item.sweetLevel}</Text>

                {item.toppings.map((topping) => (
                  <View key={topping._id} style={styles.toppingContainer}>
                    <Text style={styles.toppingText}>
                      + {topping.toppingId.name} ({topping.toppingId.price.toLocaleString("vi-VN")}đ) x{topping.quantity}
                    </Text>
                  </View>
                ))}

                <View style={{ flex: 1 }} />
                <View style={[styles.bottomContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                  <Text style={styles.productPrice}>
                    {((item.productId.price[item.size] + item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0)) * item.quantity).toLocaleString("vi-VN")}đ
                  </Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                      <AntDesign name="minuscircleo" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                      <AntDesign name="pluscircleo" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Modal Xác nhận Xóa */}
                <Modal visible={modalVisible} transparent animationType="slide">
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Xóa sản phẩm này?</Text>
                      <View style={styles.modalButtons}>
                        <Button title="Hủy" onPress={() => setModalVisible(false)} />
                        <Button
                          title="OK"
                          onPress={() => {
                            if (selectedItem) {
                              removeFromCart(selectedItem); 
                            }
                            setModalVisible(false);
                          }}
                          color="red"
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            </View>
          ) : (
            <Text style={{ color: "red" }}>Lỗi: Sản phẩm không tồn tại!</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    backgroundColor: "#F5F5F5",
    paddingBottom: 100,
  },
  buttonContainer: {
    marginHorizontal: 90,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
    alignSelf: "center"
  },
  infoContainer: {
    backgroundColor: "#E2E6E9",
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20
  },
  infoText: {
    textAlign: "center",
    color: "#5B6A79"
  },
  productContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    padding: 10,
    marginHorizontal: 5
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    resizeMode: "contain",
    alignSelf: "center"
  },
  productDetails: {
    marginLeft: 10,
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold"
  },
  productSize: {
    color: "#B7905F"
  },
  productDescription: {
    color: "#666"
  },
  bottomContainer: {

    paddingTop: 5,
    marginTop: 5,
  },
  productPrice: {
    marginTop: 5,
    fontWeight: "bold"
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto"
  },
  quantityText: {
    marginHorizontal: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 20
  },
  totalText: {
    fontSize: 16
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold"
  },
  continueButton: {
    backgroundColor: "#7EA172",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: "center"
  },
  continueText: {
    color: "#fff",
    fontWeight: "bold"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  toppingContainer: {
    marginLeft: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginBottom: 3,
  },
  toppingText: {
    fontSize: 14,
    color: "#555",
  },
  deleteButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default CartScreen;
