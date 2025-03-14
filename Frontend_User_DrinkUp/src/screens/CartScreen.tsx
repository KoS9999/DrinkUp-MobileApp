import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../components/CartContext";

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
  const { items, totalAmount, removeFromCart } = useCart();

  useEffect(() => {
    const fetchCart = async () =>{
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
        // const text = await response.text();
        // console.log("Response Text:", text);
        const data = await response.json();
        console.log("API Response:", data);

        if (response.ok) {
          setCart(data);
          setLoading(false);
        } else {
          console.error("Failed to fetch cart:", data.message);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // const calculateTotalAmount = () => {
  //   if (!cart) return 0;
  //   return cart.items.reduce((total, item) => {
  //     const productPrice = item.productId.price[item.size] * item.quantity;
  //     const toppingPrice = item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0);
  //     return total + productPrice + toppingPrice;
  //   }, 0);
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Giỏ hàng</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Bạn có {cart?.items.length || 0} sản phẩm trong giỏ hàng</Text>
      </View>

      {cart?.items.map((item) => (
        item.productId ? (

          <View key={item._id} style={styles.productContainer}>
            <Image source={{ uri: item.productId.imageUrl }} style={styles.productImage} />
            <View style={styles.productDetails}>

              <Text style={styles.productName}>{item.productId.name}</Text>
              
              <Text style={styles.productSize}>Size {item.size}</Text>
              <Text style={styles.productDescription}>Đá: {item.iceLevel}, Đường: {item.sweetLevel}</Text>

              {item.toppings.map((topping) => (
                <View key={topping._id} style={styles.toppingContainer}>
                  <Text style={styles.toppingText}>
                    
                    + {topping.toppingId.name} x{topping.quantity} ({topping.toppingId.price.toLocaleString("vi-VN")}đ)
                  </Text>
                </View>
              ))}

              <View style={{ flex: 1 }} />
              <View style={[styles.bottomContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
              {/* <Text style={styles.productPrice}>
                {(item.productId.price[item.size] * item.quantity + item.toppings.reduce((sum, topping) => sum + topping.toppingId.price * topping.quantity, 0)).toLocaleString("vi-VN")}đ
              </Text> */}
                <View style={styles.quantityControl}>
                  <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <AntDesign name="minuscircleo" size={24} color="black" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                    <AntDesign name="pluscircleo" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        ):(
          <Text key={item._id} style={{ color: "red" }}>Lỗi: Sản phẩm không tồn tại!</Text> // Hiển thị lỗi
        )
      ))
      }
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>{cart?.items.length} sản phẩm</Text>
        {/* <Text style={styles.totalAmount}>{calculateTotalAmount().toLocaleString("vi-VN")}đ</Text> */}
      </View>
      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueText}>Tiếp tục</Text>
      </TouchableOpacity>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  }
});

export default CartScreen;
