import React, { useEffect, useState, useRef } from "react";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Modal } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import Toast from "react-native-toast-message";
import { FlatList } from "react-native";

type Product = {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: { S: number; M: number; L: number };
    imageUrl: string;
  };
  quantity: number;
  size: "S" | "M" | "L";
  toppings: {
    _id: string;
    toppingId: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }[];
  iceLevel: "Không đá" | "Ít đá" | "Đá bình thường" | "Đá riêng";
  sweetLevel: "Không ngọt" | "Ít ngọt" | "Ngọt bình thường" | "Nhiều ngọt";
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
  return token;
};

const CartScreen: React.FC = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const fetchCart = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok || response.status === 404) {
        setCart(data);
        if (!data?.items?.length) {
          Toast.show({
            type: "info",
            text1: "Thông báo",
            text2: "Bạn chưa có sản phẩm nào trong giỏ hàng 👀",
            position: "top",
            visibilityTime: 4000,
          });
        }
      } else {
        throw new Error(data.message || "Không thể tải giỏ hàng");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải giỏ hàng. Vui lòng thử lại!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      const token = await getAuthToken();
      if (loggedIn !== 'true' || !token) {
        navigation.navigate('Login');
      } else {
        setIsLoggedIn(true);
        fetchCart();
      }
    };

    checkLoginStatus();
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        fetchCart();
      }
    }, [isLoggedIn])
  );

  const calculateTotalAmount = () => {
    if (!cart?.items || cart.items.length === 0) return 0;

    return cart.items.reduce((total, item) => {
      const itemPrice =
        (item.productId.price[item.size] +
          item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0)) *
        item.quantity;

      return total + itemPrice;
    }, 0);
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể xóa sản phẩm");
      }

      fetchCart();
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Sản phẩm đã được xóa khỏi giỏ hàng!",
      });
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xóa sản phẩm. Vui lòng thử lại!",
      });
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/cart/update-quantity/${itemId}`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật số lượng sản phẩm");
      }

      fetchCart();
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật số lượng. Vui lòng thử lại!",
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  // Animation for modal
  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
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
        data={cart?.items || []}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Giỏ hàng</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Bạn có {cart?.items.length || 0} sản phẩm trong giỏ hàng</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>{cart?.items.length} sản phẩm</Text>
              <Text style={styles.totalAmount}>{calculateTotalAmount().toLocaleString("vi-VN")}đ</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: cart?.items.length ? "#7EA172" : "#ccc" }
              ]}
              onPress={() => navigation.navigate("OrderScreen")}
              disabled={!cart?.items.length}
            >
              <Text style={styles.continueText}>Tiếp tục</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) =>
          item.productId ? (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ProductDetailScreen", {
                  productId: item.productId._id,
                  cartItem: {
                    size: item.size,
                    iceLevel: item.iceLevel,
                    sweetLevel: item.sweetLevel,
                    toppings: item.toppings.map((topping) => ({
                      toppingId: {
                        _id: topping.toppingId._id,
                        name: topping.toppingId.name,
                        price: topping.toppingId.price
                      },
                      _id: topping._id,
                      quantity: topping.quantity
                    })),
                    quantity: item.quantity,
                    cartItemId: item._id,
                  },
                  isEditing: true,
                });
              }}
            >
              <View style={styles.productContainer}>
                <Image source={{ uri: item.productId.imageUrl }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.productId.name}</Text>
                  <Text style={styles.productSize}>Size {item.size}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setSelectedItem(item._id);
                      openModal();
                    }}
                  >
                    <AntDesign name="closecircleo" size={24} color="#c23a41" />
                  </TouchableOpacity>
                  <Text style={styles.productDescription}>Đá: {item.iceLevel}, Đường: {item.sweetLevel}</Text>
                  {item.toppings.map((topping, index) => (
                    <View key={topping?._id || index} style={styles.toppingContainer}>
                      {topping?.toppingId ? (
                        <Text style={styles.toppingText}>
                          + {topping.toppingId.name} ({topping.toppingId.price?.toLocaleString("vi-VN")}đ) x{topping.quantity}
                        </Text>
                      ) : (
                        <Text style={styles.toppingText}>Topping không xác định</Text>
                      )}
                    </View>
                  ))}
                  <View style={{ flex: 1 }} />
                  <View style={[styles.bottomContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                    <Text style={styles.productPrice}>
                      {((item.productId.price[item.size] + item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0)) * item.quantity).toLocaleString("vi-VN")}đ
                    </Text>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)}>
                        <AntDesign name="minuscircleo" size={24} color="black" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)}>
                        <AntDesign name="pluscircleo" size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "red" }}>Lỗi: Sản phẩm không tồn tại!</Text>
          )
        }
      />
      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.modalTitle}>Xóa sản phẩm này?</Text>
            <Text style={styles.modalMessage}>
              Bạn có chắc muốn xóa sản phẩm khỏi giỏ hàng?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deletemodalButton]}
                onPress={() => {
                  if (selectedItem) {
                    removeFromCart(selectedItem);
                  }
                  closeModal();
                }}
              >
                <Text style={styles.modalButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    paddingBottom: 100,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#757575",  
  },
  deletemodalButton: {
    backgroundColor: "#ff4444",  
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,  
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartScreen;