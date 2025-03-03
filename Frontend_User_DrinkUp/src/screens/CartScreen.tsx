import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

type Product = {
  id: number;
  name: string;
  size: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
};

type CartScreenProps = {
  navigation: any;
};

const products: Product[] = [
  {
    id: 1,
    name: "TRÀ ĐÀO HỒNG ĐÀI",
    size: "Size L",
    description: "Đá bình thường, Ngọt bình thường",
    price: 64000,
    quantity: 1,
    image: "https://cdn.shopify.com/s/files/1/0537/9997/files/tra_dao_bao_nhieu_calo_cach_uong_tra_dao_khong_bi_tang_can_1_480x480.jpg?v=1695697682"
  },
  {
    id: 2,
    name: "TRÀ VẢI",
    size: "Size L",
    description: "Ngọt bình thường, Đá bình thường",
    price: 54000,
    quantity: 1,
    image: "https://micaynagathuduc.com/wp-content/uploads/2022/07/sinh-to-vai-osterberg.jpg"
  },
  {
    id: 3,
    name: "TRÀ CÓC",
    size: "Size L",
    description: "Ngọt bình thường, Ít đá",
    price: 69000,
    quantity: 1,
    image: "https://katinat.vn/wp-content/uploads/2024/04/432783099_402994675762732_8827534077984566267_n.jpg"
  }
];

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const totalAmount = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const [quantity, setQuantity] = useState<number>(1);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Giỏ hàng</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Bạn có {products.length} sản phẩm trong giỏ hàng</Text>
      </View>
      {products.map((product) => (
        <View key={product.id} style={styles.productContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productSize}>{product.size}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>

            <View style={{ flex: 1 }} />
            <View style={[styles.bottomContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
              <Text style={styles.productPrice}>{product.price.toLocaleString("vi-VN")}đ</Text>
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
      ))
      }
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>{products.length} sản phẩm</Text>
        <Text style={styles.totalAmount}>{totalAmount.toLocaleString("vi-VN")}đ</Text>
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
    backgroundColor: "#fff"
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
    padding: 10,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd"
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 10
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
  }
});

export default CartScreen;
